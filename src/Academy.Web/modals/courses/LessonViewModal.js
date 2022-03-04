import { useState, useCallback, useEffect, useMemo, forwardRef, useRef, useImperativeHandle } from 'react';
import Link from 'next/link';
import { Form, Modal, OverlayTrigger, Tooltip, ProgressBar, Tabs, Tab, Nav } from 'react-bootstrap';
import { useForm, Controller as FormController } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

import { useConfetti, withAsync, withRemount } from '../../utils/hooks';
import { arrayMove, preventDefault, sleep, stripHtml } from '../../utils/helpers';

import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

import { pascalCase } from 'change-case';

import Loader from '../../components/Loader';

import { BsArrowLeft, BsCheckCircleFill, BsFilm, BsGripVertical, BsJournalRichtext, BsLightbulb, BsLightbulbFill, BsMusicNoteBeamed, BsXCircle, BsXCircleFill, BsXLg } from 'react-icons/bs';
import TruncateMarkup from 'react-truncate-markup';
import { SvgBitCube, SvgBitCubes } from '../../resources/images/icons';

import Plyr from 'plyr-react';
import 'plyr-react/dist/plyr.css';
import _ from 'lodash';
import { useClient } from '../../utils/client';
import { useDialog } from '../../utils/dialog';
import CertificateViewDialog from './CertificateViewDialog';
import { useEventDispatcher } from '../../utils/eventDispatcher';
import { useAppSettings } from '../../utils/appSettings';
import { ModalPathPrefix } from '..';


const LessonView = (props) => {
    const { lesson, setCurrentView } = props;

    useEffect(() => {
        const newLesson = { ...lesson, _submitted: false, _data: { lessonId: lesson.id } };
        setCurrentView(newLesson);
    }, []);

    const tabs = useMemo(() => {
        const tabs = [];

        if (lesson.document != null) {
            tabs.push({ lesson, key: 'document', title: 'Document', icon: <span className="align-text-bottom"><BsJournalRichtext size="1rem" /></span> });
        }

        if (lesson.media != null) {
            const media = lesson.media;

            tabs.push({ lesson, key: media.type, title: pascalCase(media.type), icon: <span className="align-text-bottom">{media.type == 'video' ? <BsFilm size="1rem" /> : media.type == 'audio' ? <BsMusicNoteBeamed size="1rem" /> : <></>}</span> });
        }
        return tabs;
    }, []);

    return (
        <Tab.Container id={`lesson_${lesson.id}`} defaultActiveKey={tabs[0]?.key}>
            {(tabs.length > 1) && (
                <div className="position-absolute bottom-0 start-50 translate-middle-x zi-1 pb-4 mb-10">
                    <Nav variant="segment" className="shadow-sm">
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
            <Tab.Content className={`row justify-content-center g-0 h-100`}>
                {tabs.map(tab => {

                    if (tab.key == 'document') {
                        return (
                            <Tab.Pane key={tab.key} eventKey={tab.key} className="col-12 col-md-8 col-lg-7 col-xl-6">
                                <div className="w-100 h-100 text-break" dangerouslySetInnerHTML={{ __html: lesson.document }} />
                            </Tab.Pane>
                        );
                    }
                    else if (tab.key == 'video' || tab.key == 'audio') {
                        const media = lesson.media;

                        return (
                            <Tab.Pane key={tab.key} eventKey={tab.key} className="col-12 col-md-8 col-lg-7 col-xl-6">
                                <div className={`root ${media.type == 'audio' ? 'd-flex align-items-center justify-content-center h-100' : ''}`}>
                                    <Plyr
                                        source={
                                            {
                                                /* https://github.com/sampotts/plyr#the-source-setter */
                                                type: media.type,
                                                title: media.name,
                                                sources: [
                                                    {
                                                        src: media.url,
                                                        type: media.contentType,
                                                    },
                                                ],
                                            }
                                        }
                                        options={
                                            {
                                                /* https://github.com/sampotts/plyr#options */
                                                controls: [
                                                    'play-large', // The large play button in the center
                                                    'play', // Play/pause playback
                                                    'progress', // The progress bar and scrubber for playback and buffering
                                                    'current-time', // The current time of playback
                                                    'duration', // The full duration of the media
                                                    'mute', // Toggle mute
                                                    'volume', // Volume control
                                                    'captions', // Toggle captions
                                                    'settings', // Settings menu
                                                    'pip', // Picture-in-picture (currently Safari only)
                                                    'airplay', // Airplay (currently Safari only)
                                                    'fullscreen' // Toggle fullscreen
                                                ]
                                            }
                                        }
                                        {
                                        ...{
                                            /* Direct props for inner video tag (mdn.io/video) */
                                        }
                                        }
                                    />
                                    <style jsx>{`.root > :global(.plyr) {--plyr-color-main: var(--bs-primary) !important;border-radius: .3125rem;}`}</style>
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
    const { lesson, question, setCurrentView } = props;

    useEffect(() => {
        // shuffle answers.
        const answers = _.shuffle(question.answers).map((answer, answerIndex) => ({ ...answer, index: answerIndex, checked: false }));

        const newQuestion = {
            ...question, answers,
            _submitted: false,
            _data: {
                lessonId: lesson.id,
                questionId: question.id,
                answers: question.type == 'reorder' ? answers.map(answer => answer.id) : []
            }
        };
        setCurrentView(newQuestion);
    }, []);

    const handleAnswer = (index) => {

        if (question.type == 'singleAnswer' || question.type == 'multipleAnswer') {

            const answers = ({
                'singleAnswer': question.answers.map((answer, answerIndex) => ({ ...answer, checked: answerIndex == index ? !answer.checked : false })),
                'multipleAnswer': question.answers.map((answer, answerIndex) => ({ ...answer, checked: answerIndex == index ? !answer.checked : answer.checked })),
            })[question.type] ?? null;

            answers.forEach((answer, answerIndex) => { answer.index = answerIndex; });

            const newQuestion = {
                ...question, answers,
                _submitted: false,
                _data: {
                    lessonId: lesson.id,
                    questionId: question.id,
                    answers: answers.filter(answer => answer.checked).map(answer => answer.id)
                }
            };
            setCurrentView(newQuestion);
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

        const newQuestion = {
            ...question, answers, _submitted: false, _data: {
                lessonId: lesson.id,
                questionId: question.id,
                answers: answers.map(answer => answer.id)
            }
        };
        setQuestion(newQuestion);
    };

    return (
        <div className="row justify-content-center g-0 h-100">
            <div className="col-12 col-md-7 col-lg-6 col-xl-5">
                <div className="w-100 text-break my-3" dangerouslySetInnerHTML={{ __html: question.text }} />
                <DragDropContext onDragEnd={handleReorder}>
                    <Droppable droppableId={`question`} direction="vertical" type="lesson">
                        {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps}>
                                {question.answers.map((answer, answerIndex) => {
                                    answer.index = answerIndex;
                                    return (
                                        <Draggable key={answer.id} draggableId={`answer_${answer.id}`} index={answer.index}>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps} className="pb-3">
                                                    <div className={`card shadow-sm bg-white text-body ${answer.checked ? `${question._submitted ? (answer.correct ? 'border-success bg-soft-success' : 'border-danger bg-soft-danger') : 'border-primary bg-soft-primary'}` : `btn-outline-primary`}`}
                                                        style={{ borderLeftWidth: "5px", borderColor: "transparent" }} onClick={() => handleAnswer(answer.index)}>
                                                        <div className="d-flex justify-content-between align-items-stretch border-bottom-0" style={{ minHeight: "52px" }}>
                                                            <div className="px-2 py-1 d-flex align-items-center hstack gap-2">

                                                                <div {...provided.dragHandleProps} className={`${question.type != 'reorder' ? 'd-none' : ''}`}>
                                                                    <div className="btn btn-outline-secondary btn-sm btn-icon btn-no-focus border-0">
                                                                        <span className="svg-icon svg-icon-xs d-inline-block" ><BsGripVertical /></span>
                                                                    </div>
                                                                </div>

                                                            </div>

                                                            <div className="d-flex align-items-center flex-grow-1 cursor-default py-2 pe-3">
                                                                <div className="flex-grow-1">
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

const LessonViewModal = withRemount((props) => {
    const { route, modal, remount, updateModalProps } = props;
    const router = useRouter();
    const client = useClient();
    const dialog = useDialog();

    const [loading, setLoading] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const courseId = route.query.courseId;
    const sectionId = route.query.sectionId;
    const lessonId = route.query.lessonId;

    let [course, setCourse] = withAsync(useState(null));
    let [lesson, setLesson] = withAsync(useState(null));
    const [views, setViews] = useState([]);
    const [currentView, setCurrentView] = useState(null);

    const eventDispatcher = useEventDispatcher();

    const confetti = useConfetti();

    const load = async () => {
        setLoading({});

        await sleep(1000);
        let result = await client.get(`/courses/${courseId}`);

        if (result.error) {
            const error = result.error;
            setLoading({ ...error, message: 'Unable to load lesson.', fallback: modal.close, remount });
            return;
        }

        course = await setCourse(result.data);

        if (course.price > 0 && !course.purchased) {

            result = await client.post(`/courses/${courseId}/pay`);

            if (result.error) {
                const error = result.error;
                setLoading({ ...error, message: 'Unable to load lesson.', fallback: modal.close, remount });
                return;
            }

            const paymentId = result.data.paymentId;
            router.replace({ pathname: `${ModalPathPrefix}/payments/${paymentId}/debit`, query: { returnUrl: route.url } });
            return;
        }
        else {
            updateModalProps({
                contentClassName: 'h-100',
                fullscreen: true
            });
        }

        result = await client.get(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`);

        if (result.error) {
            const error = result.error;
            setLoading({ ...error, message: 'Unable to load lesson.', fallback: modal.close, remount });
            return;
        }

        lesson = await setLesson(result.data);

        const newViews = [];

        newViews.push({ ...lesson, _id: _.uniqueId(), _type: 'lesson' });
        lesson.questions.forEach(question => { newViews.push({ ...question, _id: _.uniqueId(), _type: 'question' }) })

        setViews(newViews);
        setCurrentView(newViews[0]);
        setLoading(null);
    };

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
            modal.close();
        }
    };

    const moveForward = async (skip) => {

        if (course.price > 0 && !course.purchased) {
            setSubmitting(true);

            let result = await client.post(`/courses/${courseId}/pay`);

            if (result.error) {
                const error = result.error;
                toast.error(error.message);
                setSubmitting(false);
                return;
            }

            const paymentId = result.data.paymentId;
            router.replace({ pathname: `${ModalPathPrefix}/cashin/${paymentId}`, query: { returnUrl: route.url } });
            return;
        }

        if (currentView._type != 'question') {

            setSubmitting(true);
            let result = await client.post(`/courses/${courseId}/progress`, currentView._data);

            if (result.error) {
                const error = result.error;
                toast.error(error.message);
                setSubmitting(false);
                return;
            }

            course = await setCourse((await client.get(`/courses/${courseId}`, { throwIfError: true })).data.data);
            eventDispatcher.emit(`editCourse`, course);
            await client.reloadUser();
            setSubmitting(false);
        }
        else if (currentView._type == 'question' && (!currentView._submitted || (skip && !currentView._correctAnswer))) {

            setSubmitting(true);
            let result = await client.post(`/courses/${courseId}/progress`, { ...currentView._data, skip });

            if (result.error) {
                const error = result.error;
                toast.error(error.message);
                setSubmitting(false);
                return;
            }

            course = await setCourse((await client.get(`/courses/${courseId}`, { throwIfError: true })).data.data);
            eventDispatcher.emit(`editCourse`, course);
            await client.reloadUser();
            setSubmitting(false);

            const question = course.sections
                .flatMap(section => section.lessons)
                .flatMap(lesson => lesson.questions)
                .find(_question => _question.id == currentView.id);

            const _correctAnswer = question.choices.slice(-1)[0];

            let _alert = _correctAnswer ?
                { type: 'success', message: 'Correct answer, Continue!' } :
                { type: 'error', message: 'Wrong answer, Please try again!' };

            if (_correctAnswer) confetti.fire();

            let answers = currentView.answers;

            if (currentView.type == 'singleAnswer' || currentView.type == 'multipleAnswer') {
                answers = currentView.answers.map(answer => ({
                    ...answer,
                    [skip ? 'checked' : undefined]: question.answers.find(_answer => _answer.id == answer.id).checked,
                    correct: question.answers.find(_answer => _answer.id == answer.id).checked,
                }));
            }
            else if (currentView.type == 'reorder') {

                // Reorder the answers accordingly.

                if (skip) {
                    answers = currentView.answers.sort(function (a, b) {
                        return question.answers.findIndex(answer => answer.id == a.id) - question.answers.findIndex(answer => answer.id == b.id);
                    });
                }
            }

            setCurrentView({ ...currentView, answers, _correctAnswer, _alert, _submitted: true });
            return;
        }

        const currentViewIndex = views.findIndex(view => view._id == currentView._id);
        const nextView = views[currentViewIndex + 1];

        if (nextView != null) {
            setCurrentView(nextView);
        }
        else {
            modal.close();

            const lessons = course.sections.flatMap(section => section.lessons);
            const lessonComplete = lessons.slice(-1)[0]?.id == lesson.id && lessons.every(_lesson => _lesson.status == 'completed');
            if (lessonComplete && course.certificateTemplate) {
                await dialog.open({ course }, CertificateViewDialog);
            }
        }
    };

    if (loading) return (<Loader {...loading} />);

    return (
        <>
            <Modal.Header className="py-2 px-2 zi-1">
                <div className="row justify-content-center g-0 w-100 h-100">
                    <div className="col-12 col-md-8 col-lg-7 col-xl-6">
                        <div className="d-flex align-items-center justify-content-between">
                            <OverlayTrigger placement="bottom" overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Back</Tooltip>}>
                                <a className="btn btn-outline-secondary btn-sm btn-icon btn-no-focus border-0" onClick={() => moveBackward()}>
                                    <span className="svg-icon svg-icon-sm d-inline-block" ><BsArrowLeft /></span>
                                </a>
                            </OverlayTrigger>

                            <div className="mb-0 mx-2">
                                <div className="h6 text-center mb-0"><TruncateMarkup lines={1}><div>{lesson.title}</div></TruncateMarkup></div>
                                <div className="pt-1 small">

                                    <div className="hstack gap-2 justify-content-center">
                                        <div className="d-inline-flex align-items-center"><div className="svg-icon svg-icon-xs"><SvgBitCube /></div><div className="ms-1 fw-bold">{client.user.bits}</div></div>
                                    </div>
                                </div>
                            </div>
                            <a className="btn btn-outline-secondary btn-sm btn-icon btn-no-focus border-0" onClick={() => modal.close()}>
                                <span className="svg-icon svg-icon-xs d-inline-block" ><BsXLg /></span>
                            </a>
                        </div>
                    </div>
                </div>
            </Modal.Header>

            <Modal.Body className="position-static">
                <>
                    {currentView._type == 'lesson' && <LessonView key={currentView.id} {...{ course, lesson: currentView, setCurrentView, moveBackward, moveForward }} />}
                    {currentView._type == 'question' && <QuestionView key={currentView.id}  {...{ course, lesson, question: currentView, setCurrentView, moveBackward, moveForward }} />}
                </>
            </Modal.Body>

            <Modal.Footer className="zi-1 py-3">
                <div className="row justify-content-center g-0 w-100 h-100">
                    <div className="col-12 col-md-8 col-lg-7 col-xl-6">
                        <div className="d-flex gap-3 justify-content-end w-100">
                            {currentView._type == 'question' && !currentView._correctAnswer && (
                                <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Find answer</Tooltip>}>
                                    <button className="btn btn-secondary btn-icon" disabled={submitting} onClick={async () => {
                                        const confirmed = await dialog.confirm({
                                            title: 'Find the answer',
                                            body: <>Use your bits to find the answer. (You have <span className="svg-icon svg-icon-xs d-inline-block me-1"><SvgBitCube /></span>{client.user.bits})</>
                                        });

                                        if (confirmed) {
                                            moveForward(true);
                                        }
                                    }}><span className="svg-icon svg-icon-xs"><BsLightbulb /></span></button>
                                </OverlayTrigger>
                            )}
                            <button className={`btn btn-primary  px-5 w-100 w-sm-auto`} type="button" disabled={submitting} onClick={() => moveForward()}>
                                <div>{currentView._type == 'question' ? (currentView._submitted ? 'Continue' : 'Check answer') : ('Continue')}</div>
                            </button>
                        </div>
                    </div>
                </div>
            </Modal.Footer>
        </>
    );
});

LessonViewModal.getModalProps = () => {
    return {
        size: 'sm'
    };
};

export default LessonViewModal;