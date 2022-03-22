import { CKEditor } from "@ckeditor/ckeditor5-react";
import DecoupledEditor from '@ckeditor/ckeditor5-build-decoupled-document';

import { useRef, useState } from 'react';

const Editor = ({ value, onChange }) => {
    const [opended, setOpended] = useState(false);
    const editorRef = useRef(null);

    return (
        <>
            <div className={opended ? "ck-editor position-fixed top-50 start-50 translate-middle bg-light w-100 h-100" : "d-none"} style={{ zIndex: "99999" }}>
                <CKEditor
                    onReady={editor => {
                        console.log('Editor is ready to use!', editor);

                        // Insert the toolbar before the editable area.
                        editor.ui.getEditableElement().parentElement.insertBefore(
                            editor.ui.view.toolbar.element,
                            editor.ui.getEditableElement()
                        );

                        editorRef.current = editor;
                    }}
                    onError={(error, { willEditorRestart }) => {
                        // If the editor is restarted, the toolbar element will be created once again.
                        // The `onReady` callback will be called again and the new toolbar will be added.
                        // This is why you need to remove the older toolbar.
                        if (willEditorRestart) {
                            this.editor.ui.view.toolbar.element.remove();
                        }
                    }}
                    onChange={(event, editor) => {
                        onChange && onChange(editor.getData());
                    }}
                    editor={DecoupledEditor}
                    data={value}
                    config={{}}
                />
                <button type="button" className="btn btn-outline-secondary w-100 position-absolute bottom-0 start-50 translate-middle-x bg-white zi-3" onClick={() => setOpended(!opended)}>{opended ? 'Close' : 'Open'} document</button>
                <style jsx>
                    {`div > :global(.ck-editor, .ck-editor .ck-editor__editable, .ck-editor .ck-editor__main) { height: 100%; }`}
                </style>
            </div>
            <button type="button" className="btn btn-outline-secondary w-100" onClick={() => setOpended(!opended)}>{opended ? 'Close' : 'Open'} document</button>
        </>
    );
};

export default Editor;