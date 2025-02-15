'use client';

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Quote,
  Upload,
  X,
} from "lucide-react";
import { Button } from "../UI/Button";
import { useCallback, useState, useRef } from "react";
import { Input } from "../UI/Input";
import {Alert} from "../UI/Alert";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

interface MenuBarProps {
  editor: ReturnType<typeof useEditor>;
  onImageUpload?: (file: File) => Promise<string>;
}

function MenuBar({ editor, onImageUpload }: MenuBarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const addLink = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!editor || !linkUrl) return;

    // Ensure URL has protocol
    const url = linkUrl.startsWith("http") ? linkUrl : `https://${linkUrl}`;
    editor.chain().focus().setLink({ href: url }).run();
    setLinkUrl("");
    setShowLinkInput(false);
  }, [editor, linkUrl]);


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (!file || !onImageUpload) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const imageUrl = await onImageUpload(file);
      editor?.chain().focus().setImage({ src: imageUrl }).run();
      setShowImageUpload(false);
    } catch (error) {
      setError("Failed to upload image. Please try again.");
      console.error("Image upload error:", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  
  if (!editor) {
    return null;
  }


  const handleButtonClick = (e: React.MouseEvent, callback: () => void) => {
    e.preventDefault(); // Prevent form submission
    callback();
  };
  

  return (
    <div className="border-b border-gray-200 p-2 flex flex-wrap gap-1 items-center bg-white rounded-t-lg">
      {error && (
        <div className="w-full mb-2">
          <Alert type="error" message={error} />
        </div>
      )}
      {/* Text Formatting */}
      <Button
        variant="outline"
        size="sm"
        onClick={(e) =>
          handleButtonClick(e, () => editor.chain().focus().toggleBold().run())
        }
        className={editor.isActive("bold") ? "bg-gray-200" : ""}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) =>
          handleButtonClick(e, () =>
            editor.chain().focus().toggleItalic().run()
          )
        }
        className={editor.isActive("italic") ? "bg-gray-200" : ""}
      >
        <Italic className="h-4 w-4" />
      </Button>

      {/* Headings */}
      <Button
        variant="outline"
        size="sm"
        onClick={(e) =>
          handleButtonClick(e, () =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          )
        }
        className={
          editor.isActive("heading", { level: 1 }) ? "bg-gray-200" : ""
        }
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) =>
          handleButtonClick(e, () =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          )
        }
        className={
          editor.isActive("heading", { level: 2 }) ? "bg-gray-200" : ""
        }
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      {/* Lists */}
      <Button
        variant="outline"
        size="sm"
        onClick={(e) =>
          handleButtonClick(e, () =>
            editor.chain().focus().toggleBulletList().run()
          )
        }
        className={editor.isActive("bulletList") ? "bg-gray-200" : ""}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) =>
          handleButtonClick(e, () =>
            editor.chain().focus().toggleOrderedList().run()
          )
        }
        className={editor.isActive("orderedList") ? "bg-gray-200" : ""}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      {/* Alignment */}
      <Button
        variant="outline"
        size="sm"
        onClick={(e) =>
          handleButtonClick(e, () =>
            editor.chain().focus().setTextAlign("left").run()
          )
        }
        className={editor.isActive({ textAlign: "left" }) ? "bg-gray-200" : ""}
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) =>
          handleButtonClick(e, () =>
            editor.chain().focus().setTextAlign("center").run()
          )
        }
        className={
          editor.isActive({ textAlign: "center" }) ? "bg-gray-200" : ""
        }
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) =>
          handleButtonClick(e, () =>
            editor.chain().focus().setTextAlign("right").run()
          )
        }
        className={editor.isActive({ textAlign: "right" }) ? "bg-gray-200" : ""}
      >
        <AlignRight className="h-4 w-4" />
      </Button>

      {/* Blockquote */}
      <Button
        variant="outline"
        size="sm"
        onClick={(e) =>
          handleButtonClick(e, () =>
            editor.chain().focus().toggleBlockquote().run()
          )
        }
        className={editor.isActive("blockquote") ? "bg-gray-200" : ""}
      >
        <Quote className="h-4 w-4" />
      </Button>

      {/* Links and Images */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            setShowLinkInput(!showLinkInput);
          }}
          className={editor.isActive("link") ? "bg-gray-200" : ""}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        {showLinkInput && (
          <div className="absolute top-full text-black mt-1 z-50 bg-white rounded-lg shadow-lg p-2 flex space-x-2">
            <Input
              type="text"
              placeholder="Enter URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="text-sm"
            />
            <Button size="sm" onClick={addLink}>
              Add
            </Button>
          </div>
        )}
      </div>

      {/* Image Upload */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            if (onImageUpload) {
              setShowImageUpload(!showImageUpload);
            } else {
              const url = window.prompt("Enter image URL");
              if (url) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            }
          }}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        {showImageUpload && onImageUpload && (
          <div className="absolute top-full mt-1 z-50 bg-white rounded-lg shadow-lg p-4">
            <div className="flex flex-col space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload Image
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImageUpload(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Undo/Redo */}
      <Button
        variant="outline"
        size="sm"
        onClick={(e) =>
          handleButtonClick(e, () => editor.chain().focus().undo().run())
        }
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) =>
          handleButtonClick(e, () => editor.chain().focus().redo().run())
        }
        disabled={!editor.can().redo()}
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function RichTextEditor({
  content,
  onChange,
  className = "",
  onImageUpload,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-500 hover:text-blue-700 underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full rounded-lg",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose max-w-none min-h-[200px] focus:outline-none",
      },
    },
    immediatelyRender: false,
  });
  

  return (
    <div className={`border rounded-lg ${className}`}>
      <MenuBar editor={editor} onImageUpload={onImageUpload} />
      <EditorContent
        editor={editor}
        className="prose max-w-none px-2 py-2 text-base text-gray-900 min-h-[200px] focus:outline-none"
      />
    </div>
  );
}