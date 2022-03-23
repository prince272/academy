import React from 'react';
import SunEditor, { buttonList } from "suneditor-react";
import 'suneditor/dist/css/suneditor.min.css'; // Import Sun Editor's CSS File

export default () => {
    return (<SunEditor  setDefaultStyle="font-family: Inter,sans-serif; font-size: 1rem;" setOptions={{
        height: 200,

        buttonList: buttonList.complex  // Or Array of button list, eg. [['font', 'align'], ['image']]
        // plugins: [font] set plugins, all plugins are set by default
        // Other option
    }} />)
};