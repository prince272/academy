import React, { useState, useCallback, useEffect, useMemo, forwardRef, useRef, useImperativeHandle } from 'react';

import _ from 'lodash';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import * as htmlEntities from 'html-entities';
import { FaFire, FaCode } from 'react-icons/fa';


import ReactDOMServer from 'react-dom/server';
import parse, { domToReact } from 'html-react-parser';

import { pascalCase } from 'change-case';

import { arrayMove, formatNumber, preventDefault, sleep, stripHtml } from '../utils/helpers';
import { Tab } from 'react-bootstrap';

class IFrame extends React.Component {
    state = { contentHeight: 100 };

    handleResize = () => {
        const { body, documentElement } = this.container.contentWindow.document;
        const contentHeight = Math.max(
            body.clientHeight,
            body.offsetHeight,
            body.scrollHeight,
            documentElement.clientHeight,
            documentElement.offsetHeight,
            documentElement.scrollHeight
        );
        if (contentHeight !== this.state.contentHeight) this.setState({ contentHeight });
    };

    onLoad = () => {
        this.container.contentWindow.addEventListener('resize', this.handleResize);
        this.handleResize();
    }

    componentWillUnmount() {
        this.container.contentWindow.removeEventListener('resize', this.handleResize);
    }

    render() {
        const { contentHeight } = this.state;
        return (
            <iframe
                frameBorder="0"
                onLoad={this.onLoad}
                ref={(container) => { this.container = container; }}
                scrolling="no"
                style={{ width: '100%', height: `${contentHeight}px` }}
                {...this.props}
            />
        );
    }
}

const CodeViewer = (props) => {
    const [key, setKey] = useState('input');
    const [{ language, script }, setInput] = useState({
        script: props.script,
        language: props.language
    });
    const [output, setOutput] = useState('');
    const [loading, setLoading] = useState(null);

    const preview = props.preview === undefined ? (() => {
        switch (language) {
            case 'html': return true;
            case 'css': return false;
            case 'js': return false;
        }
    })() : props.preview;

    const extensions = [{
        'html': (() => html({ matchClosingTags: true, autoCloseTags: true }))(),
        'css': (() => css({}))(),
        'js': (() => javascript({}))()
    }[language]].filter(l => l);

    return (
        <div className="card vstack gap-1 p-1 mb-5">
            <Tab.Container activeKey={key} onSelect={(k) => setKey(k)}>
                <Tab.Content>
                    <Tab.Pane className="h-100" eventKey="input">
                        <div className="h-100 position-relative">
                            <CodeMirror className="h-100 small"
                                value={script}
                                height="100%"
                                theme='dark'
                                readOnly={preview}
                                extensions={extensions}
                                onChange={(value, viewUpdate) => {
                                    setInput({ language, script: value });
                                }}
                            />
                            <style jsx>{`
                            div > :global(.cm-theme-dark .cm-scroller) {
                                padding-top: 1.5rem!important;
                                padding-bottom: 1.5rem!important;
                                font-family: Consolas, monospace !important;
                                font-size: 0.875rem;
                            }
                            div > :global(.cm-theme-dark .cm-editor) {
                                border-radius: .3125rem!important;
                                font-family: Consolas, monospace !important;
                                font-size: 0.875rem;
                            }
                            `}</style>
                            <div className="position-absolute top-0 end-0 mt-2 me-2"><div className="badge bg-secondary text-dark opacity-75">{language.toUpperCase()}</div></div>
                        </div>
                    </Tab.Pane>
                    <Tab.Pane className="h-100" eventKey="output">
                        <IFrame srcDoc={output} />
                    </Tab.Pane>
                </Tab.Content>
                {preview &&
                    (
                        <div>
                            <button onClick={async () => {
                                setLoading({});
                                if (key == 'input') {
                                    setOutput(script);
                                }
                                setKey(_.xor(['input', 'output'], [key])[0]);
                                setLoading(null);
                            }} type="button" className="btn btn-sm btn-outline-primary d-block w-100">
                                {{
                                    input: <><span className="svg-icon svg-icon-xs d-inline-block"><FaCode /></span> Source code</>,
                                    output: <><span className="svg-icon svg-icon-xs d-inline-block"><FaFire /></span> Preview</>
                                }[_.xor(['input', 'output'], [key])[0]]}
                            </button>
                        </div>
                    )}
            </Tab.Container>
        </div>
    );
};

const DocumentViewer = ({ document }) => {
    return (
        <>
            <div>
                {parse(document || '', {
                    replace: domNode => {
                        if (domNode.tagName == 'pre' && domNode.attribs && domNode.attribs['data-language'] !== undefined) {
                            const language = domNode.attribs['data-language'];
                            let preview = domNode.attribs['data-preview'];
                            preview = preview && JSON.parse(preview);
                            const script = htmlEntities.decode(ReactDOMServer.renderToStaticMarkup(domToReact(domNode.children)));
                            return <CodeViewer readOnly={true} {...{ language, preview, script }} />
                        }
                    }
                })}
            </div>
        </>
    );
};

export default DocumentViewer;