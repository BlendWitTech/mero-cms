'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, Wand2, TextQuote, AlignLeft, RefreshCcw } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useNotification } from '@/context/NotificationContext';

interface AiAssistantProps {
    editor: any;
}

export default function AiAssistant({ editor }: AiAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useNotification();

    if (!editor) return null;

    const handleAiAction = async (action: string, prompt: string) => {
        setIsLoading(true);
        setIsOpen(false);

        try {
            // Get selected text or last few paragraphs for context
            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to, ' ');
            const context = selectedText || editor.getText().slice(-500);

            const res = await apiRequest('/ai/generate', {
                method: 'POST',
                body: { prompt, context },
            });

            if (res.text) {
                if (selectedText) {
                    // Replace selection
                    editor.chain().focus().insertContent(res.text).run();
                } else {
                    // Append at cursor
                    editor.chain().focus().insertContent('\n' + res.text).run();
                }
                showToast('AI content generated!', 'success');
            }
        } catch (error: any) {
            showToast(error.message || 'AI generation failed. Upgrade your plan?', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const actions = [
        { id: 'continue', name: 'Continue Writing', icon: Wand2, prompt: 'Continue writing this section based on the context.' },
        { id: 'summarize', name: 'Summarize', icon: AlignLeft, prompt: 'Summarize the selected text or current section.' },
        { id: 'professional', name: 'Make Professional', icon: TextQuote, prompt: 'Rewrite the selected text in a professional, corporate tone.' },
        { id: 'rewrite', name: 'Rephrase', icon: RefreshCcw, prompt: 'Rephrase the selected text to make it more engaging.' },
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                onMouseDown={(e) => e.preventDefault()}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    isOpen 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                        : 'bg-white dark:bg-white/5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20'
                }`}
            >
                {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <Sparkles className="h-3.5 w-3.5 fill-current" />
                )}
                AI Studio
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 left-0 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/5 p-2 z-[100] animate-in fade-in zoom-in-95 duration-200">
                    <p className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-white/5 mb-1">AI Writing Assistant</p>
                    <div className="space-y-1">
                        {actions.map(action => (
                            <button
                                key={action.id}
                                onClick={() => handleAiAction(action.id, action.prompt)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-left group"
                            >
                                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 group-hover:bg-blue-500/10 transition-colors">
                                    <action.icon className="h-3.5 w-3.5" />
                                </div>
                                {action.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
