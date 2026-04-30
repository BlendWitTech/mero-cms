import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';
import Highlight from '@tiptap/extension-highlight';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';
import FontFamily from '@tiptap/extension-font-family';
import { TextStyle } from '@tiptap/extension-text-style';
import { Extension, Node } from '@tiptap/core';

// Custom Font Size Extension
const FontSize = Extension.create({
    name: 'fontSize',
    addOptions() {
        return {
            types: ['textStyle'],
        };
    },
    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
                        renderHTML: attributes => {
                            if (!attributes.fontSize) {
                                return {};
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}`,
                            };
                        },
                    },
                },
            },
        ];
    },
    addCommands() {
        return {
            setFontSize: fontSize => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize })
                    .run();
            },
            unsetFontSize: () => ({ chain }) => {
                return chain()
                    .setMark('textStyle', { fontSize: null })
                    .removeEmptyTextStyle()
                    .run();
            },
        };
    },
});

const lowlight = createLowlight(common);

import {
    BoldIcon,
    ItalicIcon,
    ListBulletIcon,
    PhotoIcon,
    LinkIcon,
    ArrowUturnLeftIcon,
    ArrowUturnRightIcon,
    Bars3BottomLeftIcon,
    Bars3Icon,
    Bars3BottomRightIcon,
    QueueListIcon,
    MinusIcon,
    CodeBracketIcon,
    PaintBrushIcon,
    ChatBubbleBottomCenterTextIcon,
    NoSymbolIcon,
    ListBulletIcon as UnorderedListIcon,
    QueueListIcon as OrderedListIcon,
    Bars3Icon as UnderlineIcon // We'll keep this but rename internally if needed, or find better
} from '@heroicons/react/24/outline';
import MediaLibrary from '../media/MediaLibrary';
import AiAssistant from './AiAssistant';

// Custom icons for headings since Heroicons doesn't provide them
const H1Icon = () => <span className="text-[10px] font-black leading-none">H1</span>;
const H2Icon = () => <span className="text-[10px] font-black leading-none">H2</span>;
const H3Icon = () => <span className="text-[10px] font-black leading-none">H3</span>;

const MenuButton = ({ onClick, isActive = false, icon: Icon, title }: any) => (
    <button
        onClick={onClick}
        onMouseDown={(e) => e.preventDefault()}
        title={title}
        className={`p-2 rounded-xl transition-all duration-200 ${isActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-105'
            : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
    >
        <Icon className="h-4 w-4" strokeWidth={2.5} />
    </button>
);

const MenuBar = ({ editor, onOpenMedia }: { editor: any, onOpenMedia: () => void }) => {
    if (!editor) return null;

    const setLink = () => {
        const url = window.prompt('URL');
        if (url) editor.chain().focus().setLink({ href: url }).run();
    };

    const fontFamilies = [
        { label: 'Default', value: '' },
        { label: 'Inter', value: 'Inter, sans-serif' },
        { label: 'Serif', value: 'ui-serif, Georgia, serif' },
        { label: 'Mono', value: 'ui-monospace, SFMono-Regular, monospace' },
        { label: 'Outfit', value: 'Outfit, sans-serif' },
    ];

    const fontSizes = [
        { label: 'Small', value: '12px' },
        { label: 'Normal', value: '16px' },
        { label: 'Large', value: '20px' },
        { label: 'Extra Large', value: '24px' },
        { label: 'Title', value: '32px' },
    ];

    return (
        <div className="flex flex-wrap items-center gap-1.5 p-4 border-b border-slate-100 bg-slate-50/30 backdrop-blur-sm sticky top-0 z-20 rounded-t-[2.5rem]">
            {/* AI Assistant */}
            <div className="flex items-center pr-3 mr-3 border-r border-slate-200">
                <AiAssistant editor={editor} />
            </div>

            {/* History */}
            <div className="flex items-center gap-1 pr-3 mr-3 border-r border-slate-200">
                <MenuButton onClick={() => editor.chain().focus().undo().run()} icon={ArrowUturnLeftIcon} title="Undo" />
                <MenuButton onClick={() => editor.chain().focus().redo().run()} icon={ArrowUturnRightIcon} title="Redo" />
            </div>

            {/* Typography Groups */}
            <div className="flex items-center gap-1 pr-3 mr-3 border-r border-slate-200">
                <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={H1Icon} title="Heading 1" />
                <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={H2Icon} title="Heading 2" />
                <MenuButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} icon={H3Icon} title="Heading 3" />
            </div>

            {/* Font Family */}
            <div className="flex items-center pr-3 mr-3 border-r border-slate-200">
                <select
                    onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                    value={editor.getAttributes('textStyle').fontFamily || ''}
                    className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 outline-none cursor-pointer"
                >
                    {fontFamilies.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
            </div>

            {/* Font Size */}
            <div className="flex items-center pr-3 mr-3 border-r border-slate-200">
                <select
                    onChange={(e) => editor.chain().focus().setFontSize(e.target.value).run()}
                    value={editor.getAttributes('textStyle').fontSize || ''}
                    className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 outline-none cursor-pointer"
                >
                    <option value="">Size</option>
                    {fontSizes.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
            </div>

            {/* Text Style */}
            <div className="flex items-center gap-1 pr-3 mr-3 border-r border-slate-200">
                <MenuButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={BoldIcon} title="Bold" />
                <MenuButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={ItalicIcon} title="Italic" />
                <MenuButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} icon={UnderlineIcon} title="Underline" />
                <MenuButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} icon={PaintBrushIcon} title="Highlight" />
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-1 pr-3 mr-3 border-r border-slate-200">
                <MenuButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} icon={Bars3BottomLeftIcon} title="Align Left" />
                <MenuButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} icon={Bars3Icon} title="Align Center" />
                <MenuButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} icon={Bars3BottomRightIcon} title="Align Right" />
            </div>

            {/* Blocks */}
            <div className="flex items-center gap-1 pr-3 mr-3 border-r border-slate-200">
                <MenuButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={UnorderedListIcon} title="Bullet List" />
                <MenuButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={OrderedListIcon} title="Ordered List" />
                <MenuButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={ChatBubbleBottomCenterTextIcon} title="Blockquote" />
                <MenuButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} icon={CodeBracketIcon} title="Code Block" />
            </div>

            {/* Insertion & Clean */}
            <div className="flex items-center gap-1">
                <MenuButton onClick={onOpenMedia} icon={PhotoIcon} title="Insert Image from Media Library" />
                <MenuButton onClick={setLink} isActive={editor.isActive('link')} icon={LinkIcon} title="Set Link" />
                <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={MinusIcon} title="Horizontal Rule" />
                <MenuButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} icon={ArrowUturnLeftIcon} title="Clear Formatting" />
            </div>
        </div>
    );
};

// ── Layout preset definitions ─────────────────────────────────────────────────
const IMG_PRESETS = [
    { label: '1/row',   title: 'Full width',   align: 'center', newWidth: '100%', icon: <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><rect x="0" y="0" width="16" height="11" rx="1.5"/></svg> },
    { label: '2/row',   title: '2 per row',    align: 'half',   newWidth: '49%',  icon: <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><rect x="0" y="0" width="7"  height="11" rx="1.5"/><rect x="9"   y="0" width="7"   height="11" rx="1.5"/></svg> },
    { label: '3/row',   title: '3 per row',    align: 'third',  newWidth: '31%',  icon: <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><rect x="0" y="0" width="4"  height="11" rx="1"/><rect x="6"    y="0" width="4"   height="11" rx="1"/><rect x="12"  y="0" width="4" height="11" rx="1"/></svg> },
    { label: 'Float L', title: 'Float left',   align: 'left',   newWidth: null,   icon: <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><rect x="0" y="0" width="7" height="7" rx="1.5"/><rect x="9" y="1" width="7" height="1.5" rx="0.75" opacity="0.5"/><rect x="9" y="4" width="7" height="1.5" rx="0.75" opacity="0.5"/><rect x="0" y="9.5" width="16" height="1.5" rx="0.75" opacity="0.4"/></svg> },
    { label: 'Float R', title: 'Float right',  align: 'right',  newWidth: null,   icon: <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><rect x="9" y="0" width="7" height="7" rx="1.5"/><rect x="0" y="1" width="7" height="1.5" rx="0.75" opacity="0.5"/><rect x="0" y="4" width="7" height="1.5" rx="0.75" opacity="0.5"/><rect x="0" y="9.5" width="16" height="1.5" rx="0.75" opacity="0.4"/></svg> },
] as const;

// ── Resizable image NodeView ──────────────────────────────────────────────────
const ResizableImageView = ({ node, updateAttributes, selected }: NodeViewProps) => {
    const { src, alt, title, width, align } = node.attrs;
    const resolvedWidth: string = width || '100%';
    const isFloat = align === 'left' || align === 'right';
    const isMulti = align === 'half' || align === 'third';

    const handleResizeStart = (e: React.MouseEvent, side: 'left' | 'right') => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const proseMirror = (e.currentTarget as HTMLElement).closest('.ProseMirror') as HTMLElement | null;
        const parentWidth = proseMirror?.clientWidth || 800;
        const startPct = parseFloat(resolvedWidth) || 100;
        const startPx = (startPct / 100) * parentWidth;
        const onMove = (ev: MouseEvent) => {
            const dx = ev.clientX - startX;
            const newPx = side === 'right' ? startPx + dx : startPx - dx;
            const newPct = Math.round((newPx / parentWidth) * 100);
            updateAttributes({ width: `${Math.max(10, Math.min(100, newPct))}%` });
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const applyPreset = (e: React.MouseEvent, preset: typeof IMG_PRESETS[number]) => {
        e.preventDefault();
        e.stopPropagation();
        const finalWidth = preset.newWidth ?? (parseFloat(resolvedWidth) > 55 ? '40%' : resolvedWidth);
        updateAttributes({ align: preset.align, width: finalWidth });
    };

    return (
        <NodeViewWrapper
            as="span"
            className={`resizable-img-node rimg-${align || 'center'}`}
            style={{ width: resolvedWidth }}
            data-drag-handle
        >
            <img
                src={src}
                alt={alt || ''}
                title={title || ''}
                className="bg-transparent transition-all duration-300"
                style={{ width: '100%', display: 'block', userSelect: 'none', pointerEvents: 'none' }}
                draggable={false}
            />

            {selected && (
                <>
                    {/* Blue selection ring */}
                    <div style={{ position: 'absolute', inset: 0, border: '2.5px solid #3B82F6', borderRadius: 3, pointerEvents: 'none' }} />

                    {/* ── Inline toolbar (always visible when selected) ── */}
                    <div
                        onMouseDown={(e) => e.preventDefault()} // keep editor focused
                        style={{
                            position: 'absolute', top: -56, left: '50%', transform: 'translateX(-50%)',
                            background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.13)', padding: '5px 7px',
                            display: 'flex', flexDirection: 'column', gap: 4,
                            zIndex: 50, whiteSpace: 'nowrap',
                        }}
                    >
                        {/* Layout preset row */}
                        <div style={{ display: 'flex', gap: 2 }}>
                            {IMG_PRESETS.map(p => (
                                <button
                                    key={p.label}
                                    title={p.title}
                                    onMouseDown={(e) => applyPreset(e, p)}
                                    style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                        padding: '5px 8px', borderRadius: 9, border: 'none', cursor: 'pointer',
                                        background: align === p.align ? '#2563EB' : 'transparent',
                                        color: align === p.align ? '#fff' : '#64748B',
                                        fontSize: 9, fontWeight: 800, lineHeight: 1,
                                    }}
                                >
                                    {p.icon}
                                    {p.label}
                                </button>
                            ))}
                        </div>

                        {/* Width preset row — float only */}
                        {isFloat && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 3, paddingTop: 4, borderTop: '1px solid #F1F5F9' }}>
                                <span style={{ fontSize: 8, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 2 }}>W</span>
                                {[25, 33, 40, 50].map(size => (
                                    <button key={size}
                                        onMouseDown={(e) => { e.preventDefault(); updateAttributes({ width: `${size}%` }); }}
                                        style={{
                                            padding: '2px 7px', borderRadius: 6, border: 'none', cursor: 'pointer',
                                            fontSize: 10, fontWeight: 800,
                                            background: resolvedWidth === `${size}%` ? '#2563EB' : '#F1F5F9',
                                            color: resolvedWidth === `${size}%` ? '#fff' : '#64748B',
                                        }}
                                    >{size}%</button>
                                ))}
                            </div>
                        )}

                        {/* Usage hint */}
                        {(isMulti || isFloat) && (
                            <div style={{ fontSize: 9, color: '#94A3B8', paddingTop: 2, borderTop: '1px solid #F1F5F9', maxWidth: 260, lineHeight: 1.4 }}>
                                {isMulti
                                    ? `Place ${align === 'half' ? '2' : '3'} images back-to-back in the same paragraph (no Enter) for side-by-side.`
                                    : `Type text in the same paragraph — wraps around the ${align === 'left' ? 'right' : 'left'} side.`}
                            </div>
                        )}
                    </div>

                    {/* Resize handles */}
                    <div title="Drag to resize"
                        style={{ position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)', width: 10, height: 32, background: '#3B82F6', borderRadius: 5, cursor: 'ew-resize', zIndex: 20 }}
                        onMouseDown={(e) => handleResizeStart(e, 'left')}
                    />
                    <div title="Drag to resize"
                        style={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', width: 10, height: 32, background: '#3B82F6', borderRadius: 5, cursor: 'ew-resize', zIndex: 20 }}
                        onMouseDown={(e) => handleResizeStart(e, 'right')}
                    />

                    {/* Width indicator at bottom */}
                    <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10 }}>
                        {resolvedWidth}
                    </div>
                </>
            )}
        </NodeViewWrapper>
    );
};

export default function PostEditor({ content, onChange }: { content: string, onChange: (html: string) => void }) {
    const [isMediaOpen, setIsMediaOpen] = useState(false);
    const [, forceUpdate] = useState(0);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                orderedList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                codeBlock: false,
                link: false,
                underline: false,
            }),
            Image.extend({
                inline: true,
                group: 'inline',
                draggable: true,
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        width: {
                            default: '100%',
                            parseHTML: element => element.style.width || element.getAttribute('width') || '100%',
                            renderHTML: attributes => ({
                                style: `width: ${attributes.width};`,
                            }),
                        },
                        align: {
                            default: 'center',
                            parseHTML: element => element.getAttribute('data-align') || 'center',
                            renderHTML: attributes => ({
                                'data-align': attributes.align,
                                class: `image-align-${attributes.align}`,
                            }),
                        },
                    };
                },
                addNodeView() {
                    return ReactNodeViewRenderer(ResizableImageView);
                },
            }).configure({
                HTMLAttributes: {
                    class: 'bg-transparent transition-all duration-300'
                }
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-blue-600 font-bold underline decoration-blue-600/30'
                }
            }),
            Placeholder.configure({ placeholder: 'Tell your story here...' }),
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Typography,
            Highlight.configure({ multicolor: true }),
            Subscript,
            Superscript,
            TaskList,
            TaskItem.configure({ nested: true }),
            CodeBlockLowlight.configure({
                lowlight,
                HTMLAttributes: {
                    class: 'rounded-2xl bg-slate-900 text-slate-100 p-6 font-mono text-sm my-6'
                }
            }),
            TextStyle,
            FontFamily,
            FontSize,
            // Simple Video Node
            Node.create({
                name: 'video',
                group: 'block',
                draggable: true,
                addAttributes() {
                    return {
                        src: { default: null },
                        width: { default: '100%' },
                        align: { default: 'center' }
                    }
                },
                parseHTML() { return [{ tag: 'video' }] },
                renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
                    return ['div', { class: `video-wrapper align-${HTMLAttributes.align}`, style: `text-align: ${HTMLAttributes.align}` },
                        ['video', { ...HTMLAttributes, controls: true, class: 'rounded-xl shadow-xl w-full max-w-4xl mx-auto' }]
                    ]
                },
                addCommands() {
                    return {
                        setVideo: (options: any) => ({ commands }: any) => {
                            return commands.insertContent({ type: 'video', attrs: options })
                        }
                    } as any;
                }
            })
        ],
        content,
        // ... (rest of configuration)
        editorProps: {
            attributes: {
                class: 'prose prose-slate lg:prose-xl max-w-none focus:outline-none min-h-[500px] p-10 lg:p-14 leading-relaxed font-medium text-slate-700',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        onSelectionUpdate: () => {
            // Force re-render to update menu bar active states
            forceUpdate(n => n + 1);
        },
        onTransaction: () => {
            // Force re-render for undo/redo state and other transactions
            forceUpdate(n => n + 1);
        },
        immediatelyRender: false,
    });

    // Update editor content when prop changes (e.g. loading from DB)
    useEffect(() => {
        if (editor && content && editor.getHTML() !== content) {
            // Check if content is actually different to avoid cursor jumping or loops
            // For simple use cases, this specific check is usually enough, or we can use JSON comparison
            // Simplified check: only update if editor content is very different or empty
            if (Math.abs(content.length - editor.getHTML().length) > 10 || !editor.getText()) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    const handleSelectImage = (url: string) => {
        if (editor) {
            const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
            const isImageSelected = (editor.state.selection as any)?.node?.type?.name === 'image';
            if (isVideo) {
                // @ts-ignore
                editor.chain().focus().setVideo({ src: url }).run();
            } else if (isImageSelected) {
                editor.chain().focus().updateAttributes('image', { src: url }).run();
            } else {
                editor.chain().focus().setImage({ src: url }).run();
            }
            setIsMediaOpen(false);
        }
    };

    return (
        <div className="border border-slate-200 rounded-2xl bg-white shadow-2xl shadow-slate-200 focus-within:ring-8 focus-within:ring-blue-600/5 transition-all duration-500">
            <MenuBar editor={editor} onOpenMedia={() => setIsMediaOpen(true)} />
            <div className="custom-scrollbar overflow-y-auto max-h-[800px] prose-img-custom">
                <style jsx global>{`
                    /* ── NodeView image wrapper base ──────────────────────── */
                    .prose-img-custom .resizable-img-node {
                        position: relative;
                        box-sizing: border-box;
                        max-width: 100%;
                    }

                    /* Center — block, margin auto */
                    .prose-img-custom .rimg-center {
                        display: block;
                        margin-left: auto;
                        margin-right: auto;
                        margin-top: 1.5rem;
                        margin-bottom: 1.5rem;
                    }

                    /* 2 per row */
                    .prose-img-custom .rimg-half {
                        display: inline-block !important;
                        vertical-align: top;
                        margin: 0.25% 0.5%;
                    }

                    /* 3 per row */
                    .prose-img-custom .rimg-third {
                        display: inline-block !important;
                        vertical-align: top;
                        margin: 0.25% 1%;
                    }

                    /* Float left — text wraps right */
                    .prose-img-custom .rimg-left {
                        float: left !important;
                        display: block;
                        margin-right: 1.75rem;
                        margin-top: 0.25rem;
                        margin-bottom: 0.75rem;
                    }

                    /* Float right — text wraps left */
                    .prose-img-custom .rimg-right {
                        float: right !important;
                        display: block;
                        margin-left: 1.75rem;
                        margin-top: 0.25rem;
                        margin-bottom: 0.75rem;
                    }

                    /* Remove whitespace gaps between inline-block images */
                    .prose-img-custom .ProseMirror p:has(.rimg-half),
                    .prose-img-custom .ProseMirror p:has(.rimg-third) {
                        font-size: 0;
                        line-height: 0;
                    }

                    /* Per-paragraph clearfix so floated images don't bleed out */
                    .prose-img-custom .ProseMirror p::after {
                        content: "";
                        display: table;
                        clear: both;
                    }

                    /* ── Legacy output classes (keep for already-saved content) ── */
                    .prose-img-custom .image-align-center { display: block; margin: 1.5rem auto; }
                    .prose-img-custom .image-align-half   { display: inline-block; vertical-align: top; margin: 0.25% 0.5%; box-sizing: border-box; }
                    .prose-img-custom .image-align-third  { display: inline-block; vertical-align: top; margin: 0.25% 1%;   box-sizing: border-box; }
                    .prose-img-custom .image-align-left   { float: left;  margin-right: 1.75rem; margin-bottom: 0.75rem; }
                    .prose-img-custom .image-align-right  { float: right; margin-left:  1.75rem; margin-bottom: 0.75rem; }
                    .prose-img-custom .image-align-full   { display: block; width: 100% !important; max-width: none; margin: 2rem 0; }
                `}</style>
                <EditorContent editor={editor} />
            </div>

            <MediaLibrary
                isOpen={isMediaOpen}
                onClose={() => setIsMediaOpen(false)}
                onSelect={handleSelectImage}
            />
        </div >
    );
}
