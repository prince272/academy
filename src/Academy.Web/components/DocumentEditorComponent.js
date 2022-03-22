import React, { useState, useRef, useMemo } from 'react';
import JoditEditor from "jodit-react";

export default ({ value, onChange, readonly }) => {
    const editor = useRef(null)

    return (
        useMemo(() => <JoditEditor
            ref={editor}
            value={value}
            config={{
                readonly
            }}
            tabIndex={1} // tabIndex of textarea
            onBlur={onChange} // preferred to use only this option to update the content for performance reasons
            onChange={onChange}
        />, [])
    );
}