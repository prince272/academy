import React from 'react'
import ReactDOM from 'react-dom'

import hljs from 'highlight.js'
import 'react-quill/dist/quill.core.css'
import 'react-quill/dist/quill.snow.css'
import 'highlight.js/styles/github.css'

import katex from "katex";
import "katex/dist/katex.min.css";
window.katex = katex;

import ReactQuill from 'react-quill'

hljs.configure({
    languages: ['javascript', 'ruby', 'python', 'rust'],
})

const modules = {
    syntax: {
        highlight: text => hljs.highlightAuto(text).value,
    },
    toolbar: [
        [{ 'font': [] }],
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
        ['blockquote', 'code-block'],

        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
        [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent       

        [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown

        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme

        [{ 'align': [] }],

        ['link', 'image', 'video', 'formula'], // link and image, video

        ['clean']

    ],
    clipboard: {
        matchVisual: false,
    },
}

const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link',
    'image',
    'video',
    'code-block',
]

const Editor = (props) => {

    return (
        <ReactQuill
            theme="snow"
            modules={modules}
            formats={formats}
            {...props}
        />
    )
};

export default Editor;