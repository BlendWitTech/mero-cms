import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getConfig() {
        try {
            const config = await this.prisma.analyticsConfig.findFirst({
                where: { isActive: true },
            });

            if (!config) {
                // Create default config
                const newConfig = await this.prisma.analyticsConfig.create({
                    data: {
                        isActive: true,
                    },
                });
                return newConfig;
            }

            return config;
        } catch (error) {
            console.error('Error in getConfig:', error);
            throw error;
        }
    }

    async updateConfig(data: any) {
        const config = await this.getConfig();

        // Remove system fields that shouldn't be updated manually
        const { id, createdAt, updatedAt, ...updateData } = data;

        try {
            return await this.prisma.analyticsConfig.update({
                where: { id: config.id },
                data: updateData,
            });
        } catch (error) {
            console.error('Failed to update analytics config:', error);
            throw error;
        }
    }

    async getDashboardMetrics() {
        try {
            const config = await this.getConfig();

            if (!config?.serviceAccountEmail || !config?.privateKey || !config?.ga4PropertyId) {
                return this.getMockMetrics();
            }

            const privateKey = this.formatPrivateKey(config.privateKey);
            const analyticsDataClient = new BetaAnalyticsDataClient({
                credentials: {
                    client_email: config.serviceAccountEmail,
                    private_key: privateKey,
                },
            });

            const propertyId = config.ga4PropertyId;
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            // 1. Basic Metrics Comparison
            type MetricKey = 'activeUsers' | 'screenPageViews' | 'newUsers' | 'sessions' | 'engagementRate' | 'averageSessionDuration';
            const metricsList: MetricKey[] = ['activeUsers', 'screenPageViews', 'newUsers', 'sessions', 'engagementRate', 'averageSessionDuration'];

            const currentMetrics = await this.runReport(analyticsDataClient, propertyId, today, today, metricsList);
            const pastMetrics = await this.runReport(analyticsDataClient, propertyId, yesterday, yesterday, metricsList);

            // 2. Real-time Users
            const [realTimeResponse] = await analyticsDataClient.runRealtimeReport({
                property: `properties/${propertyId}`,
                metrics: [{ name: 'activeUsers' }],
            });

            // 3. Reports for Dashboard
            const topPagesResponse = await this.runReport(analyticsDataClient, propertyId, '7daysAgo', 'today', ['screenPageViews', 'activeUsers'], ['pagePath'], 5);
            const trafficResponse = await this.runReport(analyticsDataClient, propertyId, '28daysAgo', 'today', ['activeUsers'], ['sessionSource'], 5);
            const devicesResponse = await this.runReport(analyticsDataClient, propertyId, '28daysAgo', 'today', ['activeUsers'], ['deviceCategory']);
            const geoResponse = await this.runReport(analyticsDataClient, propertyId, '28daysAgo', 'today', ['activeUsers'], ['country'], 10);

            // Mapping results
            const cur = currentMetrics.rows?.[0]?.metricValues || [];
            const pas = pastMetrics.rows?.[0]?.metricValues || [];

            const summary = {
                visitors: this.createMetricObj(cur[0], pas[0]),
                pageViews: this.createMetricObj(cur[1], pas[1]),
                newUsers: this.createMetricObj(cur[2], pas[2]),
                sessions: this.createMetricObj(cur[3], pas[3]),
                engagementRate: this.createMetricObj(cur[4], pas[4], true),
                avgSessionDuration: this.createMetricObj(cur[5], pas[5], true),
            };

            return {
                summary,
                realTimeVisitors: parseInt(realTimeResponse.rows?.[0]?.metricValues?.[0]?.value || '0'),
                topPages: topPagesResponse.rows?.map(row => ({
                    path: row.dimensionValues?.[0]?.value || '',
                    views: parseInt(row.metricValues?.[0]?.value || '0'),
                    visitors: parseInt(row.metricValues?.[1]?.value || '0'),
                })) || [],
                trafficSources: this.processDimensionReport(trafficResponse),
                devices: this.processDimensionReport(devicesResponse),
                locations: geoResponse.rows?.map(row => ({
                    country: row.dimensionValues?.[0]?.value || '',
                    visitors: parseInt(row.metricValues?.[0]?.value || '0'),
                })) || [],
            };
        } catch (error) {
            console.error('Failed to fetch GA4 data:', error);
            throw new Error(`Failed to fetch GA4 data: ${error.message || error}`);
        }
    }

    async testConnection(configData: any) {
        try {
            if (!configData.serviceAccountEmail || !configData.privateKey || !configData.ga4PropertyId) {
                throw new BadRequestException('Missing required GA4 configuration fields');
            }

            const privateKey = this.formatPrivateKey(configData.privateKey);

            const analyticsDataClient = new BetaAnalyticsDataClient({
                credentials: {
                    client_email: configData.serviceAccountEmail,
                    private_key: privateKey,
                },
            });

            // Try to fetch a simple report (last 1 day active users) to verify access
            await analyticsDataClient.runReport({
                property: `properties/${configData.ga4PropertyId}`,
                dateRanges: [{ startDate: 'today', endDate: 'today' }],
                metrics: [{ name: 'activeUsers' }],
            });

            return {
                success: true,
                message: `Connection successful! Logic is linked to Property ID: ${configData.ga4PropertyId}. Data tracking is active for Measurement ID: ${configData.ga4MeasurementId || 'Not Set'}`
            };
        } catch (error) {
            console.error('GA4 Connection Test Failed:', error);
            // Extract meaningful error message from Google API error
            let errorMessage = error.message || 'Unknown error occurred';

            if (error.details) {
                errorMessage = error.details;
            } else if (error.code === 7) {
                errorMessage = 'Permission denied. Check if the Service Account Email has access to this Property.';
            } else if (error.code === 16) {
                errorMessage = 'Authentication failed. Check your Private Key and Service Account Email.';
            }

            throw new BadRequestException(`Connection failed: ${errorMessage}`);
        }
    }

    private formatPrivateKey(key: string): string {
        try {
            if (!key) return '';

            // 1. Remove any existing quotes or whitespace
            let formattedKey = key.trim();
            if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
                formattedKey = formattedKey.slice(1, -1);
            }

            // 2. Replace literal \n with actual newlines
            formattedKey = formattedKey.replace(/\\n/g, '\n');

            // 3. Ensure headers exist if they are missing (common paste error)
            const header = '-----BEGIN PRIVATE KEY-----';
            const footer = '-----END PRIVATE KEY-----';

            if (!formattedKey.includes(header)) {
                formattedKey = `${header}\n${formattedKey}`;
            }

            if (!formattedKey.includes(footer)) {
                formattedKey = `${formattedKey}\n${footer}`;
            }

            // 4. Sometimes keys are pasted as a single long string without newlines inside the body
            // This is a heuristic to fix that if it looks like a single block
            // However, doing this blindly can break valid keys. 
            // The safest bet for now is ensuring headers/footers and correct newline replacement.

            return formattedKey;
        } catch (e) {
            console.warn('Error formatting private key:', e);
            return key;
        }
    }

    private async runReport(client: any, propertyId: string, startDate: string, endDate: string, metrics: string[], dimensions: string[] = [], limit: number = 0) {
        const [response] = await client.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate, endDate }],
            dimensions: dimensions.map(name => ({ name })),
            metrics: metrics.map(name => ({ name })),
            limit,
            orderBys: metrics.length > 0 && dimensions.length > 0 ? [{ metric: { metricName: metrics[0] }, desc: true }] : undefined,
        });
        return response;
    }

    private createMetricObj(cur: any, pas: any, isFloat = false) {
        const today = isFloat ? parseFloat(cur?.value || '0') : parseInt(cur?.value || '0');
        const yesterday = isFloat ? parseFloat(pas?.value || '0') : parseInt(pas?.value || '0');
        return {
            today,
            yesterday,
            change: this.calculatePercentageChange(yesterday, today),
        };
    }

    private processDimensionReport(response: any) {
        const total = response.rows?.reduce((sum, row) => sum + parseInt(row.metricValues?.[0]?.value || '0'), 0) || 1;
        return response.rows?.map(row => ({
            label: row.dimensionValues?.[0]?.value || '',
            visitors: parseInt(row.metricValues?.[0]?.value || '0'),
            percentage: parseFloat(((parseInt(row.metricValues?.[0]?.value || '0') / total) * 100).toFixed(1)),
        })) || [];
    }

    private calculatePercentageChange(oldVal: number, newVal: number): number {
        if (oldVal === 0) return newVal > 0 ? 100 : 0;
        return parseFloat((((newVal - oldVal) / oldVal) * 100).toFixed(1));
    }

    async getTrend(days = 7): Promise<{ date: string; pageViews: number; visitors: number; sessions: number }[]> {
        try {
            const config = await this.getConfig();
            if (!config?.serviceAccountEmail || !config?.privateKey || !config?.ga4PropertyId) {
                return this.getMockTrend(days);
            }

            const privateKey = this.formatPrivateKey(config.privateKey);
            const analyticsDataClient = new BetaAnalyticsDataClient({
                credentials: {
                    client_email: config.serviceAccountEmail,
                    private_key: privateKey,
                },
            });

            const [response] = await analyticsDataClient.runReport({
                property: `properties/${config.ga4PropertyId}`,
                dateRanges: [{ startDate: `${days - 1}daysAgo`, endDate: 'today' }],
                dimensions: [{ name: 'date' }],
                metrics: [
                    { name: 'screenPageViews' },
                    { name: 'activeUsers' },
                    { name: 'sessions' },
                ],
                orderBys: [{ dimension: { dimensionName: 'date' } }],
            });

            return (response.rows || []).map(row => ({
                date: row.dimensionValues?.[0]?.value || '',
                pageViews: parseInt(row.metricValues?.[0]?.value || '0'),
                visitors: parseInt(row.metricValues?.[1]?.value || '0'),
                sessions: parseInt(row.metricValues?.[2]?.value || '0'),
            }));
        } catch (error) {
            console.error('Failed to fetch GA4 trend data:', error);
            return this.getMockTrend(days);
        }
    }

    private getMockTrend(days: number): { date: string; pageViews: number; visitors: number; sessions: number }[] {
        return Array.from({ length: days }, (_, i) => {
            const d = new Date(Date.now() - (days - 1 - i) * 86400000);
            const dateStr = d.toISOString().split('T')[0].replace(/-/g, '');
            return { date: dateStr, pageViews: 0, visitors: 0, sessions: 0 };
        });
    }

    private getMockMetrics() {
        return {
            summary: {
                pageViews: { today: 0, yesterday: 0, change: 0 },
                visitors: { today: 0, yesterday: 0, change: 0 },
                newUsers: { today: 0, yesterday: 0, change: 0 },
                sessions: { today: 0, yesterday: 0, change: 0 },
                engagementRate: { today: 0, yesterday: 0, change: 0 },
                avgSessionDuration: { today: 0, yesterday: 0, change: 0 },
            },
            topPages: [],
            trafficSources: [],
            devices: [],
            locations: [],
            realTimeVisitors: 0,
        };
    }

    /**
     * Top pages by view count, used by the dashboard's top-pages
     * panel. Reads `getDashboardMetrics().topPages` if available so
     * we share whatever GA4/in-app source the dashboard already has;
     * normalises to { title, slug, views } and slices to `limit`.
     *
     * Returns [] when the underlying tracker isn't configured —
     * the controller surfaces that as an empty state.
     */
    async getTopPages(limit: number): Promise<Array<{ title: string; slug: string; views: number }>> {
        try {
            const metrics: any = await this.getDashboardMetrics();
            const raw: any[] = Array.isArray(metrics?.topPages) ? metrics.topPages : [];
            return raw.slice(0, limit).map((row) => ({
                title: row.title || row.pageTitle || row.path || row.slug || '(untitled)',
                slug:  row.slug  || row.path      || '',
                views: Number(row.views ?? row.pageViews ?? row.count ?? 0),
            }));
        } catch {
            return [];
        }
    }
}
