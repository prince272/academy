import React from 'react';
import SunEditor, { buttonList } from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css'; // Import Sun Editor's CSS File

// Import codeMirror
import CodeMirror from 'codemirror';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/lib/codemirror.css';

import katex from 'katex';
import 'katex/dist/katex.min.css';

function DocumentEditor({ value, onChange }) {

    return (
        <div>
            <SunEditor
                setAllPlugins={true}
                defaultValue={value}
                onChange={onChange}
                setDefaultStyle="font-family: Inter; font-size: 1rem;"
                setOptions={{
                    katex: katex, // window.katex,
                    codeMirror: CodeMirror,
                    buttonList: [["undo", "redo"],
                    ["font", "fontSize", "formatBlock"],
                    ["bold", "underline", "italic", "strike", "subscript", "superscript"],
                    ["removeFormat"], "/",
                    ["fontColor", "hiliteColor"],
                    ["outdent", "indent"],
                    ["align", "horizontalRule", "list", "table"],
                    ["link", "image", "video", "audio", "math"],
                    ["fullScreen", "showBlocks", "codeView"],
                    ["save"]],
                    height: 360
                }} />
            <style jsx>
                {`
          div > :global(.sun-editor, .sun-editor .sun-editor-editable) {
            font-family: inherit;
            font-size: inherit;
          }

         `}
            </style>
        </div>
    );
}
export default DocumentEditor;