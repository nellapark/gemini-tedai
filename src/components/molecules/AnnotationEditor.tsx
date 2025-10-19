import React from 'react';

interface AnnotationEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const AnnotationEditor: React.FC<AnnotationEditorProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
}) => {
  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe what's shown in this media..."
        rows={2}
        className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          className="text-sm bg-primary text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm bg-neutral-200 text-neutral-700 px-3 py-1 rounded hover:bg-neutral-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

