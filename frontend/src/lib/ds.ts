/**
 * Mero CMS design-system tokens
 * Import these in every dashboard page to guarantee visual consistency.
 */

export const card =
    'bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-white/[0.06] rounded-2xl shadow-sm';

export const cardHover =
    `${card} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`;

export const tableWrapper =
    `${card} overflow-hidden`;

export const tableHead =
    'bg-slate-50/60 dark:bg-white/[0.025] border-b border-slate-100 dark:border-white/[0.06]';

export const thCell =
    'px-5 py-3 text-left text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest';

export const tdCell =
    'px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300';

export const trRow =
    'border-b border-slate-50 dark:border-white/[0.04] hover:bg-slate-50/60 dark:hover:bg-white/[0.025] transition-colors';

export const btnPrimary =
    'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase tracking-widest shadow-sm shadow-blue-600/20 transition-all active:scale-95';

export const btnSecondary =
    'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/[0.08] transition-all active:scale-95';

export const btnDanger =
    'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[11px] uppercase tracking-widest shadow-sm shadow-red-600/20 transition-all active:scale-95';

export const iconBtn =
    'h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all';

export const iconBtnDanger =
    'h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all';

export const badge = (color: 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'slate') => {
    const map = {
        blue:   'bg-blue-50   dark:bg-blue-500/10   text-blue-700   dark:text-blue-400   border border-blue-100   dark:border-blue-500/20',
        green:  'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20',
        amber:  'bg-amber-50  dark:bg-amber-500/10  text-amber-700  dark:text-amber-400  border border-amber-100  dark:border-amber-500/20',
        red:    'bg-red-50    dark:bg-red-500/10    text-red-700    dark:text-red-400    border border-red-100    dark:border-red-500/20',
        violet: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-100 dark:border-violet-500/20',
        slate:  'bg-slate-100 dark:bg-white/[0.06]  text-slate-600  dark:text-slate-400  border border-slate-200  dark:border-white/10',
    };
    return `inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${map[color]}`;
};

export const input =
    'w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-300 dark:focus:border-blue-500/40 transition-all';

export const emptyState =
    'flex flex-col items-center justify-center py-16 gap-3 text-center';

export const sectionLabel =
    'text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest';

export const cardHeader =
    'flex items-center justify-between px-5 py-4 border-b border-slate-50 dark:border-white/[0.05]';
