import React from 'react';
import "froala-editor/css/froala_editor.pkgd.min.css";
import "froala-editor/css/froala_style.css";
import "froala-editor/js/plugins.pkgd.min.js";
import FroalaEditor from "react-froala-wysiwyg";
function DocumentEditor({ value, onChange }) {

    return (
        <div>
            <FroalaEditor
                model={value || ''}
                tag="textarea"
                onModelChange={onChange} config={{
                    events: {
                        "image.beforeUpload": function (files) {
                            var editor = this;
                            if (files.length) {
                                // Create a File Reader.
                                var reader = new FileReader();
                                // Set the reader to insert images when they are loaded.
                                reader.onload = function (e) {
                                    var result = e.target.result;
                                    editor.image.insert(result, null, null, editor.image.get());
                                };
                                // Read image as base64.
                                reader.readAsDataURL(files[0]);
                            }
                            editor.popups.hideAll();
                            // Stop default upload chain.
                            return false;
                        }
                    }
                }} />
        </div>
    );
}
export default DocumentEditor;