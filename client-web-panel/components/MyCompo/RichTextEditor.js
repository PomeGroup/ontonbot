import dynamic from 'next/dynamic';
import React, { useEffect, useRef, useState } from 'react';


const RichTextEditor = dynamic(() => import('@mantine/rte'), {
    ssr: false,
});

import { Button } from '@mantine/core';
import { IconPalette } from '@mantine/core';

export function TextColorPicker({ editor }) {
    const applyTextColor = (color) => {
        editor.chain().focus().setColor(color).run();
    };

    return (
        <Button onClick={() => applyTextColor(prompt('Enter text color (e.g., #FF0000):'))} leftIcon={<IconPalette />}>
            Text Color
        </Button>
    );
}

export function BackgroundColorPicker({ editor }) {
    const applyBackgroundColor = (color) => {
        editor.chain().focus().setHighlight({ color }).run();
    };

    return (
        <Button onClick={() => applyBackgroundColor(prompt('Enter background color (e.g., #FF0000):'))} leftIcon={<IconPalette />}>
            Background Color
        </Button>
    );
}



const CustomRichTextEditor = ({ data, onChange }) => {
    const [value, setValue] = useState(data);
    const editorContainerRef = useRef(null);

    useEffect(() => {
        setValue(data);
    }, [data]);

    const handleEditorChange = (value) => {
        setValue(value);
        onChange(value);
    };

    return (
        <div className="main-container">
            <div className="editor-container rtl-editor" ref={editorContainerRef}>
                <RichTextEditor
                    value={value}
                    onChange={handleEditorChange}
                    controls={[
                        ['colors','bold', 'italic', 'underline', 'strike', 'link', 'image'],
                        ['unorderedList', 'orderedList', 'blockquote', 'codeBlock'],
                        ['alignLeft', 'alignCenter', 'alignRight', 'alignJustify'],
                        ['undo', 'redo'],


                        ['sup', 'sub'],
                        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

                        ['clean'],
                        ['color','textColor', 'backgroundColor','bold']
                    ]}
                />
            </div>
        </div>
    );
};


export default CustomRichTextEditor;
