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

import hljs from "highlight.js";
import 'highlight.js/styles/github-dark.css';
import { AspectRatio } from 'react-aspect-ratio';

import { CreateLock } from '../../../../utils/helpers';

const DocumentViewer = withRemount(({ document, remount }) => {

    const ref = useRef();
    const client = useClient();

    const [loading, setLoading] = useState({});
    const [content, setContent] = withAsync(useState(null));

    useEffect(async () => {

        try {
            await setContent((await client.get(document.url, { throwIfError: true })).data);
            const nodes = ref.current.querySelectorAll('pre code');
            for (let i = 0; i < nodes.length; i++) { hljs.highlightElement(nodes[i]); }
        }
        catch (ex) {
            setLoading({ status: 'error', message: 'Unable to load document.', remount });
            return;
        }

        setLoading(null);

    }, [document]);

    return (
        <>
            {loading ? <Loader {...loading} /> : <></>}
            <div className="small" style={{ display: !loading ? 'block' : 'none' }} ref={ref} dangerouslySetInnerHTML={{ __html: content }} />
        </>
    );
});

const LessonView = (props) => {
    const { lesson, setCurrentView } = props;

    useEffect(() => {
        const newLesson = { ...lesson, _submitted: false, _data: {} };
        setCurrentView(newLesson);
    }, []);

    const tabs = useMemo(() => {
        const tabs = [];

        if (lesson.document != null) {
            tabs.push({ lesson, key: 'document', title: 'Document', icon: <span className="align-text-bottom"><BsJournalRichtext size="1rem" /></span> });
        }

        if (lesson.media?.url || lesson.externalMediaUrl) {
            tabs.push({ lesson, key: 'media', title: 'Media', icon: <span className="align-text-bottom">{<BsFilm size="1rem" />}</span> });
        }
        return tabs;
    }, []);

    return (
        <Tab.Container id={`lesson_${lesson.id}`} defaultActiveKey={tabs[0]?.key}>
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
                                <DocumentViewer document={lesson.document} />
                            </Tab.Pane>
                        );
                    }
                    else if (tab.key == 'media') {
                        const mediaUrl = lesson.media?.url || lesson.externalMediaUrl;
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
LessonView.displayName = 'LessonView';

const QuestionView = (props) => {
    const client = useClient();
    const dialog = useDialog();
    const { lesson, question, setCurrentView, moveForward, submitting } = props;
    const appSettings = useAppSettings();

    useEffect(() => {
        // shuffle answers.
        const answers = _.shuffle(question.answers).map((answer, answerIndex) => ({ ...answer, index: answerIndex, checked: false }));

        const newQuestion = {
            ...question, answers,
            _submitted: false,
            _inputs: question.type == 'reorder' ? answers.map(answer => answer.id) : []
        };
        setCurrentView(newQuestion);
    }, []);

    const handleSelect = (index) => {

        if (question.type == 'selectSingle' || question.type == 'selectMultiple') {

            const answers = (({
                'selectSingle': question.answers.map((answer, answerIndex) => ({ ...answer, checked: answerIndex == index ? !answer.checked : false })),
                'selectMultiple': question.answers.map((answer, answerIndex) => ({ ...answer, checked: answerIndex == index ? !answer.checked : answer.checked })),
            })[question.type] || null).map((answer, answerIndex) => ({ ...answer, index: answerIndex }));

            setCurrentView({
                ...question,
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


        const answers = _.cloneDeep(question.answers);
        arrayMove(answers, source.index, destination.index);
        answers.forEach((answer, answerIndex) => { answer.index = answerIndex; });

        setCurrentView({
            ...question,
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
                <div className="w-100 text-break my-3 small">{question.text}</div>
                <DragDropContext onDragEnd={handleReorder}>
                    <Droppable droppableId={`question`} direction="vertical" type="lesson">
                        {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps}>
                                {question.answers.map((answer, answerIndex) => {
                                    answer.index = answerIndex;
                                    return (
                                        <Draggable key={answer.id} draggableId={`answer_${answer.id}`} index={answer.index}>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps}  {...provided.dragHandleProps} className="pb-3">
                                                    <div className={`card shadow-sm bg-white text-body ${answer.checked ? `${question._submitted ? (answer.correct ? 'border-success bg-soft-success' : 'border-danger bg-soft-danger') : 'border-primary bg-soft-primary'}` : `btn-outline-primary`}`}
                                                        style={{ borderLeftWidth: "5px", borderColor: "transparent" }} onClick={() => handleSelect(answer.index)}>
                                                        <div className="d-flex justify-content-between align-items-stretch border-bottom-0" style={{ minHeight: "52px" }}>
                                                            <div className="px-2 py-1 d-flex align-items-center hstack gap-2">

                                                                <div className={`${question.type != 'reorder' ? 'd-none' : ''}`}>
                                                                    <span className="svg-icon svg-icon-xs d-inline-block" ><BsGripVertical /></span>
                                                                </div>

                                                            </div>

                                                            <div className="d-flex align-items-center flex-grow-1 cursor-default py-3 pe-3">
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
                    {!question._correct && (
                        <button className="btn btn-secondary" disabled={submitting} onClick={() => {
                            moveForward(true);
                        }}>
                            <div className="position-relative d-flex align-items-center justify-content-center">
                                <div className={`${submitting ? 'invisible' : ''}`}>Seek answer <span className="svg-icon svg-icon-xs d-inline-block me-1"><SvgBitCube /></span>{appSettings.course.bitRules.seekAnswer.value}</div>
                                {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                            </div>
                        </button>
                    )}
                </div>
                {question._submitted && (
                    <div className={`alert alert-${question._alert.type == 'error' ? 'danger' : question._alert.type}`} role="alert">
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                                <span className="svg-icon svg-icon-sm text-white">
                                    {question._alert.type == 'error' ? <BsXCircleFill /> : question._alert.type == 'success' ? <BsCheckCircleFill /> : <></>}
                                </span>
                            </div>
                            <div className="flex-grow-1 ms-3">
                                <div>{question._alert.message}</div>
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

    const [views, setViews] = useState([]);
    const [currentView, setCurrentView] = useState(null);
    const appSettings = useAppSettings();

    const componentId = useMemo(() => _.uniqueId('Component'), []);

    const confetti = useConfetti();

    const mountedRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;
        };
    }, []);

    const load = async () => {
        setLoading({});

        let result = await client.get(`/courses/${courseId}`);

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

        const newViews = [];
        section.lessons.forEach(lesson => {
            newViews.push({ ...lesson, _id: _.uniqueId(), _type: 'lesson' });
            lesson.questions.forEach((question, questionIndex) => {
                newViews.push({
                    lesson,
                    ...question,
                    title: `Question ${questionIndex + 1} of ${lesson.questions.length}`,
                    _id: _.uniqueId(),
                    _type: 'question'
                })
            })
        });

        setViews(newViews);
        setCurrentView(newViews.find(newView => newView._type == 'lesson' && newView.id == lessonId));
        setLoading(null);
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
        const currentViewIndex = views.findIndex(view => view._id == currentView._id);
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

            if (currentView._type == 'lesson') {

                client.post(`/courses/${courseId}/sections/${sectionId}/lessons/${currentView.id}/progress`, {}).then(result => {

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
            else if (currentView._type == 'question') {

                if (!currentView._submitted || solve) {
                    let _inputs = currentView._inputs;
                    const answers = JSON.parse(protection.decrypt(appSettings.company.name, currentView.secret));

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
                        let result = await client.post(`/courses/${courseId}/sections/${sectionId}/lessons/${currentView.lessonId}/questions/${currentView.id}/solve`);

                        if (result.error) {
                            const error = result.error;
                            toast.error(error.message, { id: componentId });
                            return;
                        }

                        _inputs = (() => {
                            if (currentView.type == 'selectSingle' || currentView.type == 'selectMultiple') {
                                const checkedIds = answers.filter(answer => answer.checked).map(answer => answer.id.toString()).sort(comparator);
                                return checkedIds;
                            }
                            else if (currentView.type == 'reorder') {
                                const checkedIds = answers.map(answer => answer.id.toString());
                                return checkedIds;
                            }
                            else {
                                return [];
                            }
                        })();

                        client.updateUser({ bits: result.data.bits });
                    }

                    client.post(`/courses/${courseId}/sections/${sectionId}/lessons/${currentView.lessonId}/progress`, { id: currentView.id, inputs: _inputs }).then(result => {

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
                        if (currentView.type == 'selectSingle' || currentView.type == 'selectMultiple') {
                            const checkedIds = answers.filter(answer => answer.checked).map(answer => answer.id.toString()).sort(comparator);
                            const inputIds = _inputs.map(inputId => inputId.toString()).sort(comparator);
                            return sequenceEqual(checkedIds, inputIds);
                        }
                        else if (currentView.type == 'reorder') {
                            const checkedIds = answers.map(answer => answer.id.toString());
                            const inputIds = _inputs.map(inputId => inputId.toString());
                            return sequenceEqual(checkedIds, inputIds);
                        }
                        else {
                            return false;
                        }
                    })();

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

                    if (currentView.type == 'selectSingle' || currentView.type == 'selectMultiple') {
                        setCurrentView({
                            ...currentView,
                            answers: currentView.answers.map(answer => ({
                                ...answer,
                                [_correct ? 'checked' : undefined]: answers.find(a => a.id == answer.id).checked,
                                correct: answers.find(a => a.id == answer.id).checked
                            })),
                            _inputs,
                            _correct,
                            _alert,
                            _submitted: true,
                        });
                    }
                    else if (currentView.type == 'reorder') {
                        setCurrentView({
                            ...currentView,
                            answers: _correct ? currentView.answers.sort(function (a, b) {
                                return answers.findIndex(answer => answer.id == a.id) - answers.findIndex(answer => answer.id == b.id);
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

            const currentViewIndex = views.findIndex(view => view._id == currentView._id);
            const nextView = views[currentViewIndex + 1];

            if (nextView != null) {
                setCurrentView(nextView);
            }
            else {
                await lock.delay;

                const lastSection = course.sections.slice(-1)[0];

                if ((lastSection && lastSection.id == sectionId) && course.certificateTemplate) {
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

            <div key={currentView._id} className="py-2 px-3 flex-grow-1" style={{ overflowY: "auto" }}>
                {currentView._type == 'lesson' && <LessonView key={currentView.id} {...{ course, lesson: currentView, setCurrentView, moveBackward, moveForward, submitting }} />}
                {currentView._type == 'question' && <QuestionView key={currentView.id}  {...{ course, lesson: currentView.lesson, question: currentView, setCurrentView, moveBackward, moveForward, submitting }} />}
            </div>

            <div className="p-3">
                <div className="row justify-content-center g-0 w-100 h-100">
                    <div className="col-12 col-md-8 col-lg-7 col-xl-6">
                        <div className="d-flex gap-3 justify-content-end w-100">
                            <button className={`btn btn-primary px-5 w-100 w-sm-auto`} type="button" disabled={submitting || (currentView._type == 'question' && !(currentView._inputs && currentView._inputs.length))} onClick={() => moveForward()}>
                                <div className="position-relative d-flex align-items-center justify-content-center">
                                    <div><div>{currentView._type == 'question' ? (currentView._submitted ? (currentView._correct ? 'Continue' : 'Try again') : 'Check answer') : ('Continue')}</div></div>
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