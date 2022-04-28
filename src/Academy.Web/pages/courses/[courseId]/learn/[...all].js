import React, { useState, useCallback, useEffect, useMemo, forwardRef, useRef, useImperativeHandle } from 'react';
import Link from 'next/link';
import { Form, OverlayTrigger, Tooltip, ProgressBar, Tabs, Tab, Nav } from 'react-bootstrap';
import { useForm, Controller as FormController } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

import { useConfetti, withAsync, withRemount } from '../../../../utils/hooks';
import { arrayMove, formatNumber, preventDefault, sleep, stripHtml } from '../../../../utils/helpers';

import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

import { pascalCase } from 'change-case';

import Loader from '../../../../components/Loader';

import { BsArrowLeft, BsCheckCircleFill, BsFilm, BsGripVertical, BsJournalRichtext, BsXCircleFill, BsXLg } from 'react-icons/bs';

import LinesEllipsisLoose from 'react-lines-ellipsis/lib/loose'
import responsiveHOC from 'react-lines-ellipsis/lib/responsiveHOC';
const ResponsiveEllipsis = responsiveHOC()(LinesEllipsisLoose);

import { SvgBitCube, SvgBitCubes } from '../../../../resources/images/icons';

import ReactPlayer from 'react-player/lazy';

import _ from 'lodash';
import { useClient } from '../../../../utils/client';
import { useDialog } from '../../../../utils/dialog';
import CertificateViewDialog from '../../../../modals/courses/CertificateViewDialog';
import { useEventDispatcher } from '../../../../utils/eventDispatcher';
import { useAppSettings } from '../../../../utils/appSettings';
import { ModalPathPrefix } from '../../../../modals';
import { useRouterQuery } from 'next-router-query';
import protection from '../../../../utils/protection';

import ReactDOMServer from 'react-dom/server';
import parse, { domToReact } from 'html-react-parser';

import { AspectRatio } from 'react-aspect-ratio';

import { CreateLock } from '../../../../utils/helpers';
import useSound from 'use-sound';

import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import * as htmlEntities from 'html-entities';
import { FaFire, FaCode } from 'react-icons/fa';

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

    const extensions = [{
        'html': (() => html({ matchClosingTags: true, autoCloseTags: true }))(),
        'css': (() => html({ matchClosingTags: true, autoCloseTags: true }))(),
        'js': (() => html({ matchClosingTags: true, autoCloseTags: true }))()
    }[language]].filter(l => l);

    return (
        <div className="card vstack gap-1 p-1 mb-3">
            <Tab.Container activeKey={key} onSelect={(k) => setKey(k)}>
                <Tab.Content>
                    <Tab.Pane className="h-100" eventKey="input">
                        <div className="h-100 position-relative">
                            <CodeMirror className="h-100"
                                value={script}
                                height="100%"
                                theme='dark'
                                readOnly={props.readOnly}
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
                {((() => {
                    switch (language) {
                        case 'html': return true;
                        case 'css': return true;
                        case 'js': return true;
                    }
                })()) &&
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
                            const script = htmlEntities.decode(ReactDOMServer.renderToStaticMarkup(domToReact(domNode.children)));
                            return <CodeViewer readOnly={true} {...{ language, script }} />
                        }
                    }
                })}
            </div>
        </>
    );
};

const ExplanationView = (props) => {
    const { lesson, content, setCurrentView, moveForward, submitting } = props;

    useEffect(() => {
        const newContent = { ...content, _submitted: false, _data: {} };
        setCurrentView(newContent);
    }, []);

    const tabs = useMemo(() => {
        const tabs = [];

        if (content.explanation != null) {
            tabs.push({ key: 'document', title: 'Document', icon: <span className="align-text-bottom"><BsJournalRichtext size="1rem" /></span> });
        }

        if (content.media?.url || content.externalMediaUrl) {
            tabs.push({ key: 'media', title: 'Media', icon: <span className="align-text-bottom">{<BsFilm size="1rem" />}</span> });
        }
        return tabs;
    }, []);

    return (
        <Tab.Container id={`content_${content.id}`} defaultActiveKey={tabs[0]?.key}>
            {(tabs.length > 1) && (
                <div className="position-absolute bottom-0 start-50 translate-middle-x zi-1 pb-4 mb-10">
                    <Nav variant="segment" className="shadow-sm flex-nowrap text-nowrap">
                        {tabs.map(tab => {
                            return (
                                <Nav.Item key={tab.key}>
                                    <Nav.Link eventKey={tab.key} className="cursor-default"><span className="me-2">{tab.icon}</span><span>{tab.title}</span></Nav.Link>
                                </Nav.Item>
                            );
                        })}
                    </Nav>
                </div>
            )}
            <Tab.Content className={`row justify-content-center g-0`}>
                {tabs.map(tab => {

                    if (tab.key == 'document') {
                        return (
                            <Tab.Pane key={tab.key} eventKey={tab.key} className="col-12 col-md-6 col-lg-5 text-break">
                                <div className="h4 mt-3 mb-2">{lesson.title}</div>
                                <div><DocumentViewer document={content.explanation} /></div>
                            </Tab.Pane>
                        );
                    }
                    else if (tab.key == 'media') {
                        const mediaUrl = content.media?.url || content.externalMediaUrl;
                        return (
                            <Tab.Pane key={tab.key} eventKey={tab.key} className="col-12 col-md-8 col-lg-7 col-xl-6">
                                <div className="h4 mt-3 mb-2">{lesson.title}</div>
                                <div className="bg-dark">
                                    <AspectRatio ratio="1280/720">
                                        <ReactPlayer url={mediaUrl} controls={true} width="100%" height="100%" />
                                    </AspectRatio>
                                </div>
                            </Tab.Pane>
                        );
                    }
                    else {
                        return (
                            <Tab.Pane key={tab.key} eventKey={tab.key} className="col-12 col-md-8 col-lg-7 col-xl-5"></Tab.Pane>
                        );
                    }
                })}
            </Tab.Content>
        </Tab.Container>
    );
};
ExplanationView.displayName = 'ExplanationView';

const QuestionView = (props) => {
    const client = useClient();
    const dialog = useDialog();
    const { lesson, content, setCurrentView, moveForward, submitting } = props;
    const appSettings = useAppSettings();

    useEffect(() => {
        // shuffle answers.
        const answers = _.shuffle(content.answers).map((answer, answerIndex) => ({ ...answer, index: answerIndex, checked: false }));

        const newContent = {
            ...content, answers,
            _submitted: false,
            _inputs: content.answerType == 'reorder' ? answers.map(answer => answer.id) : []
        };
        setCurrentView(newContent);
    }, []);

    const handleSelect = (index) => {

        if (content.answerType == 'selectSingle' || content.answerType == 'selectMultiple') {

            const answers = (({
                'selectSingle': content.answers.map((answer, answerIndex) => ({ ...answer, checked: answerIndex == index ? !answer.checked : false })),
                'selectMultiple': content.answers.map((answer, answerIndex) => ({ ...answer, checked: answerIndex == index ? !answer.checked : answer.checked })),
            })[content.answerType] || null).map((answer, answerIndex) => ({ ...answer, index: answerIndex }));

            setCurrentView({
                ...content,
                answers,
                _inputs: answers.filter(answer => answer.checked).map(answer => answer.id),
                _correct: false,
                _alert: null,
                _submitted: false,
            });
        }
    };

    const handleReorder = (reorder) => {
        const { source, destination, type } = reorder;

        if (!source || !destination)
            return;

        source.id = source.droppableId;
        delete source.droppableId;

        destination.id = destination.droppableId;
        delete destination.droppableId;

        if (source.id == destination.id &&
            source.index == destination.index)
            return;


        const answers = _.cloneDeep(content.answers);
        arrayMove(answers, source.index, destination.index);
        answers.forEach((answer, answerIndex) => { answer.index = answerIndex; });

        setCurrentView({
            ...content,
            answers,
            _inputs: answers.map(answer => answer.id),
            _correct: false,
            _alert: null,
            _submitted: false,
        });
    };

    return (
        <div className="row justify-content-center g-0">
            <div className="col-12 col-md-7 col-lg-6 col-xl-5">
                <div className="h4 mt-3 mb-2">{lesson.title}</div>
                <div><DocumentViewer document={content.question} /></div>
                <DragDropContext onDragEnd={handleReorder}>
                    <Droppable droppableId={`content`} direction="vertical" type="lesson">
                        {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps}>
                                {content.answers.map((answer, answerIndex) => {
                                    answer.index = answerIndex;
                                    return (
                                        <Draggable key={answer.id} draggableId={`answer_${answer.id}`} index={answer.index} isDragDisabled={content.answerType != 'reorder'}>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps}  {...provided.dragHandleProps} className="pb-3">
                                                    <div className={`card shadow-sm bg-white text-body ${answer.checked ? `${content._submitted ? (answer.correct ? 'border-success bg-soft-success' : 'border-danger bg-soft-danger') : 'border-primary bg-soft-primary'}` : content.answerType == 'reorder' ? '' : `btn-outline-primary`}`}
                                                        style={{ borderLeftWidth: "5px", borderColor: "transparent" }} onClick={() => handleSelect(answer.index)}>
                                                        <div className="d-flex justify-content-between align-items-stretch border-bottom-0" style={{ minHeight: "52px" }}>
                                                            <div className="px-2 py-1 d-flex align-items-center hstack gap-2">

                                                                <div className={`${content.answerType != 'reorder' ? 'd-none' : ''}`}>
                                                                    <span className="svg-icon svg-icon-xs d-inline-block" ><BsGripVertical /></span>
                                                                </div>

                                                            </div>

                                                            <div className="d-flex align-items-center flex-grow-1 py-3 pe-3">
                                                                <div className="flex-grow-1 small">
                                                                    <div>{answer.text}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    );
                                })}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                <div className="d-flex justify-content-end mb-3">
                    {!content._correct && (
                        <button className="btn btn-secondary" disabled={submitting} onClick={() => {
                            moveForward(true);
                        }}>
                            <div className="position-relative d-flex align-items-center justify-content-center">
                                <div className={`${submitting ? 'invisible' : ''}`}>Show answer <span className="svg-icon svg-icon-xs d-inline-block me-1"><SvgBitCube /></span>{appSettings.course.bitRules.seekAnswer.value}</div>
                                {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                            </div>
                        </button>
                    )}
                </div>
                {content._submitted && (
                    <div className={`alert alert-${content._alert.type == 'error' ? 'danger' : content._alert.type}`} role="alert">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                                <span className="svg-icon svg-icon-sm text-white">
                                    {content._alert.type == 'error' ? <BsXCircleFill /> : content._alert.type == 'success' ? <BsCheckCircleFill /> : <></>}
                                </span>
                            </div>
                            <div className="flex-grow-1 ms-3">
                                <div>{content._alert.message}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
QuestionView.displayName = 'QuestionView';

const LearnPage = withRemount(({ remount }) => {
    const router = useRouter();
    const client = useClient();

    const [loading, setLoading] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const routerQuery = useRouterQuery();
    const courseId = routerQuery.courseId;
    const sectionId = routerQuery.all && routerQuery.all[0];
    const lessonId = routerQuery.all && routerQuery.all[1];

    let [course, setCourse] = withAsync(useState(null));
    let [section, setSection] = withAsync(useState(null));
    let [lesson, setLesson] = withAsync(useState(null));

    const [views, setViews] = useState([]);
    const [currentView, setCurrentView] = useState(null);
    const appSettings = useAppSettings();

    const componentId = useMemo(() => _.uniqueId('Component'), []);

    const confetti = useConfetti();

    const mountedRef = useRef(false);

    const [playCorrectSound] = useSound('/sounds/correct.mp3');

    const [playIncorrectSound] = useSound('/sounds/incorrect.mp3');

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
        };
    }, []);

    const load = async () => {
        setLoading({});

        let result = await client.get(`/courses/${courseId}`, { params: { sectionId, lessonId } });

        if (result.error) {
            const error = result.error;
            setLoading({ ...error, message: 'Unable to load lesson.', fallback: () => router.push(`/courses/${courseId}`), remount });
            return;
        }

        course = await setCourse(result.data);

        if (course.price > 0 && !course.purchased) {

            result = await client.post(`/courses/${courseId}/purchase`);

            if (result.error) {
                const error = result.error;
                setLoading({ ...error, message: 'Unable to load lesson.', fallback: () => router.push(`/courses/${courseId}`), remount });
                return;
            }

            setLoading({ status: 402, fallback: () => router.push(`/courses/${courseId}`), message: 'The lesson cannot be accessed because you need to purchase the course.', remount });
            const payment = result.data;

            router.replace(`/courses/${courseId}`)
            router.replace({ pathname: `${ModalPathPrefix}/checkout`, query: { returnUrl: window.location.href, payment: JSON.stringify(payment) } });
            return;
        }

        section = await setSection(course.sections.find(_section => _section.id == sectionId));

        if (!section) {
            setLoading({ status: 404, message: 'Unable to load lesson.', fallback: modal.close, remount });
            return;
        }

        lesson = await setLesson(section.lessons.find(_lesson => _lesson.id == lessonId));

        if (!lesson) {
            setLoading({ status: 404, message: 'Unable to load lesson.', fallback: modal.close, remount });
            return;
        }

        const newViews = [];
        lesson.contents.forEach((content, contentIndex) => {
            const answers = content.answers ? (Array.isArray(content.answers) ? content.answers : JSON.parse(protection.decrypt(appSettings.company.name, content.answers))) : content.answers;
            newViews.push({
                lesson,
                ...content,
                answers,
                predefinedAnswers: _.cloneDeep(answers)
            })
        });

        const newView = newViews[0];

        if (newView) {
            setViews(newViews);
            setCurrentView(newView);
            setLoading(null);
        }
        else {
            router.replace(`/courses/${courseId}`);
        }
    };

    useEffect(() => {
        if (!client.loading && !client.user) {
            const location = window.location;
            router.replace(`/courses/${courseId}`);
            router.replace({ pathname: `${ModalPathPrefix}/accounts/signup`, query: { returnUrl: location.href } });
        }
    }, [client.loading, client.user]);

    useEffect(() => {
        load();
    }, []);

    const moveBackward = () => {
        const currentViewIndex = views.findIndex(view => view.id == currentView.id);
        const previousView = views[currentViewIndex - 1];

        if (previousView != null) {
            setCurrentView(previousView);
        }
        else {
            router.push(`/courses/${courseId}`);
        }
    };

    const moveForward = async (solve) => {
        try {
            setSubmitting(true);

            const lock = CreateLock();

            if (currentView.type == 'explanation') {

                client.post(`/courses/${courseId}/sections/${sectionId}/lessons/${currentView.lessonId}/contents/${currentView.id}/progress`, {}).then(result => {

                    if (result.error) {
                        const error = result.error;
                        toast.error(error.message, { id: componentId });
                        return;
                    }

                    client.updateUser({ bits: result.data.bits });
                }).finally(() => {
                    lock.release();
                });
            }
            else if (currentView.type == 'question') {

                if (!currentView._submitted || solve) {
                    let _inputs = currentView._inputs;

                    const comparator = (a, b) => {
                        return a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })
                    };

                    const sequenceEqual = (a, b) => {
                        if (a === b) return true;
                        if (a == null || b == null) return false;
                        if (a.length !== b.length) return false;

                        // If you don't care about the order of the elements inside
                        // the array, you should sort both arrays here.
                        // Please note that calling sort on an array will modify that array.
                        // you might want to clone your array first.

                        for (var i = 0; i < a.length; ++i) {
                            if (a[i] !== b[i]) return false;
                        }
                        return true;
                    };

                    if (solve) {
                        let result = await client.post(`/courses/${courseId}/sections/${sectionId}/lessons/${currentView.lessonId}/contents/${currentView.id}/progress`, { solve: true });

                        if (result.error) {
                            const error = result.error;
                            toast.error(error.message, { id: componentId });
                            return;
                        }

                        _inputs = (() => {
                            if (currentView.answerType == 'selectSingle' || currentView.answerType == 'selectMultiple') {
                                const checkedIds = currentView.predefinedAnswers.filter(answer => answer.checked).map(answer => answer.id.toString()).sort(comparator);
                                return checkedIds;
                            }
                            else if (currentView.answerType == 'reorder') {
                                const checkedIds = currentView.predefinedAnswers.map(answer => answer.id.toString());
                                return checkedIds;
                            }
                            else {
                                return [];
                            }
                        })();

                        client.updateUser({ bits: result.data.bits });
                    }

                    client.post(`/courses/${courseId}/sections/${sectionId}/lessons/${currentView.lessonId}/contents/${currentView.id}/progress`, { inputs: _inputs }).then(result => {

                        if (result.error) {
                            const error = result.error;
                            toast.error(error.message, { id: componentId });
                            return;
                        }

                        client.updateUser({ bits: result.data.bits });
                    }).finally(() => {
                        lock.release();
                    });

                    const _correct = (() => {
                        if (currentView.answerType == 'selectSingle' || currentView.answerType == 'selectMultiple') {
                            const checkedIds = currentView.predefinedAnswers.filter(answer => answer.checked).map(answer => answer.id.toString()).sort(comparator);
                            const inputIds = _inputs.map(inputId => inputId.toString()).sort(comparator);
                            return sequenceEqual(checkedIds, inputIds);
                        }
                        else if (currentView.answerType == 'reorder') {
                            const checkedIds = currentView.predefinedAnswers.map(answer => answer.id.toString());
                            const inputIds = _inputs.map(inputId => inputId.toString());
                            return sequenceEqual(checkedIds, inputIds);
                        }
                        else {
                            return false;
                        }
                    })();

                    if (_correct) playCorrectSound()
                    else playIncorrectSound();

                    let _alert = _correct ?
                        {
                            type: 'success',
                            message: _.sample(['Correct answer, Continue!', `Well done, ${client.user.firstName}!`])
                        } :
                        {
                            type: 'error',
                            message: _.sample(['Wrong answer, Please try again!', `Hmm, think again, ${client.user.firstName}!`, `Give it another try, ${client.user.firstName}!`])
                        };

                    if (_correct) confetti.fire();

                    if (currentView.answerType == 'selectSingle' || currentView.answerType == 'selectMultiple') {
                        setCurrentView({
                            ...currentView,
                            answers: currentView.answers.map(answer => ({
                                ...answer,
                                [_correct ? 'checked' : undefined]: currentView.predefinedAnswers.find(a => a.id == answer.id).checked,
                                correct: currentView.predefinedAnswers.find(a => a.id == answer.id).checked
                            })),
                            _inputs,
                            _correct,
                            _alert,
                            _submitted: true,
                        });
                    }
                    else if (currentView.answerType == 'reorder') {
                        setCurrentView({
                            ...currentView,
                            answers: _correct ? currentView.answers.sort(function (a, b) {
                                return currentView.predefinedAnswers.findIndex(answer => answer.id == a.id) - currentView.predefinedAnswers.findIndex(answer => answer.id == b.id);
                            }) : currentView.answers,
                            _inputs,
                            _correct,
                            _alert,
                            _submitted: true,
                        });
                    }

                    return;
                }
                else {
                    if (!currentView._correct) {
                        setCurrentView({
                            ...currentView,
                            answers: _.shuffle(currentView.answers).map(answer => ({ ...answer, checked: false, correct: false, })),
                            _inputs: null,
                            _correct: false,
                            _alert: null,
                            _submitted: false,
                        });
                        return;
                    }

                    lock.release();
                }
            }
            else {
                lock.release();
            }

            const currentViewIndex = views.findIndex(view => view.id == currentView.id);
            const nextView = views[currentViewIndex + 1];

            if (nextView != null) {
                setCurrentView(nextView);
            }
            else {
                await lock.delay;

                const lastLesson = course.sections.flatMap(_section => _section.lessons).slice(-1)[0];

                if ((lastLesson && lastLesson.id == lessonId) && course.certificateTemplate) {
                    router.replace({ pathname: `/courses/${courseId}`, query: { certificate: true } });
                }
                else {
                    router.replace(`/courses/${courseId}`);
                }
            }
        }
        finally {
            if (mountedRef.current) setSubmitting(false);
        }
    };

    if (loading) return (<Loader {...loading} />);

    return (
        <div className="d-flex flex-column" style={{ height: "inherit" }}>
            <div className="py-2 px-3 zi-1">
                <div className="row justify-content-center g-0 w-100 h-100">
                    <div className="col-12 col-md-8 col-lg-7 col-xl-6">
                        <div className="d-flex align-items-center justify-content-between">
                            <OverlayTrigger placement="bottom" overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Back</Tooltip>}>
                                <a className="btn btn-outline-secondary btn-sm btn-icon btn-no-focus border-0" onClick={() => moveBackward()}>
                                    <span className="svg-icon svg-icon-sm d-inline-block" ><BsArrowLeft /></span>
                                </a>
                            </OverlayTrigger>

                            <div className="h6 text-center mb-0 mx-2 w-100">
                                <ResponsiveEllipsis className="overflow-hidden"
                                    text={section.title || ''}
                                    maxLine='1'
                                    ellipsis='...'
                                    trimRight
                                    basedOn='letters'
                                />
                            </div>
                            <a className="btn btn-outline-secondary btn-sm btn-icon btn-no-focus border-0" onClick={() => router.replace(`/courses/${courseId}`)}>
                                <span className="svg-icon svg-icon-xs d-inline-block" ><BsXLg /></span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div key={currentView.id} className="py-2 px-3 flex-grow-1" style={{ overflowY: "auto" }}>
                {currentView.type == 'explanation' && <ExplanationView key={currentView.id} {...{ course, lesson: currentView.lesson, content: currentView, setCurrentView, moveBackward, moveForward, submitting }} />}
                {currentView.type == 'question' && <QuestionView key={currentView.id} {...{ course, lesson: currentView.lesson, content: currentView, setCurrentView, moveBackward, moveForward, submitting }} />}
            </div>

            <div className="p-3">
                <div className="row justify-content-center g-0 w-100 h-100">
                    <div className="col-12 col-md-8 col-lg-7 col-xl-6">
                        <div className="d-flex gap-3 justify-content-end w-100">
                            <button className={`btn btn-primary px-5 w-100 w-sm-auto`} type="button" disabled={submitting || (currentView.type == 'question' && !(currentView._inputs && currentView._inputs.length))} onClick={() => moveForward()}>
                                <div className="position-relative d-flex align-items-center justify-content-center">
                                    <div><div>{currentView.type == 'question' ? (currentView._submitted ? (currentView._correct ? 'Continue' : 'Try again') : 'Check answer') : ('Continue')}</div></div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

LearnPage.getPageSettings = () => {
    return ({
        showHeader: false,
        showFooter: false
    });
}

export default LearnPage;