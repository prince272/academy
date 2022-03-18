import { useState, useCallback, useEffect, useMemo, forwardRef, useRef, useImperativeHandle } from 'react';
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

import { BsArrowLeft, BsCheckCircleFill, BsFilm, BsGripVertical, BsJournalRichtext, BsLightbulb, BsLightbulbFill, BsMusicNoteBeamed, BsXCircle, BsXCircleFill, BsXLg } from 'react-icons/bs';

import LinesEllipsisLoose from 'react-lines-ellipsis/lib/loose'
import responsiveHOC from 'react-lines-ellipsis/lib/responsiveHOC';
const ResponsiveEllipsis = responsiveHOC()(LinesEllipsisLoose);

import { SvgBitCube, SvgBitCubes } from '../../../../resources/images/icons';

import Plyr from 'plyr-react';
import 'plyr-react/dist/plyr.css';
import _ from 'lodash';
import { useClient } from '../../../../utils/client';
import { useDialog } from '../../../../utils/dialog';
import CertificateViewDialog from '../../../../modals/courses/CertificateViewDialog';
import { useEventDispatcher } from '../../../../utils/eventDispatcher';
import { useAppSettings } from '../../../../utils/appSettings';
import { ModalPathPrefix } from '../../../../modals';
import { useRouterQuery } from 'next-router-query';
import protection from '../../../../utils/protection';


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
    const { question, setCurrentView } = props;

    useEffect(() => {
        // shuffle answers.
        const answers = _.shuffle(question.answers).map((answer, answerIndex) => ({ ...answer, index: answerIndex, checked: false }));

        const newQuestion = {
            ...question, answers,
            _submitted: false,
            _data: {
                id: question.id,
                inputs: question.type == 'reorder' ? answers.map(answer => answer.id) : []
            }
        };
        setCurrentView(newQuestion);
    }, []);

    const handleAnswer = (index) => {

        if (question.type == 'selectSingle' || question.type == 'selectMultiple') {

            const answers = ({
                'selectSingle': question.answers.map((answer, answerIndex) => ({ ...answer, checked: answerIndex == index ? !answer.checked : false })),
                'selectMultiple': question.answers.map((answer, answerIndex) => ({ ...answer, checked: answerIndex == index ? !answer.checked : answer.checked })),
            })[question.type] ?? null;

            answers.forEach((answer, answerIndex) => { answer.index = answerIndex; });

            const newQuestion = {
                ...question, answers,
                _submitted: false,
                _data: {
                    id: question.id,
                    inputs: answers.filter(answer => answer.checked).map(answer => answer.id)
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
                id: question.id,
                inputs: answers.map(answer => answer.id)
            }
        };
        setCurrentView(newQuestion);
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

const LearnPage = withRemount(({ remount }) => {
    const router = useRouter();
    const client = useClient();
    const dialog = useDialog();

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

        setLoading({ message: 'Preparing lessons...' });
        result = await client.get(`/courses/${courseId}/sections/${sectionId}`);

        if (result.error) {
            const error = result.error;
            setLoading({ ...error, message: 'Unable to start lesson.', fallback: modal.close, remount });
            return;
        }

        section = await setSection(result.data);

        const newViews = [];
        section.lessons.forEach(lesson => {
            newViews.push({ ...lesson, _id: _.uniqueId(), _type: 'lesson', _data: {} });
            lesson.questions.forEach((question, questionIndex) => {
                newViews.push({
                    ...question,
                    title: `Question ${questionIndex + 1} of ${lesson.questions.length}`,
                    _id: _.uniqueId(),
                    _type: 'question',
                    _data: {}
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
            router.replace({ pathname: `${ModalPathPrefix}/accounts/signin`, query: { returnUrl: location.href } });
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

        if (currentView._type == 'lesson') {

            setSubmitting(true);
            client.post(`/courses/${courseId}/sections/${sectionId}/lessons/${currentView.id}/progress`, currentView._data).then(result => {

                if (result.error) {
                    const error = result.error;
                    toast.error(error.message, { id: componentId });
                    setSubmitting(false);
                    return;
                }

                client.updateUser({ bits: result.data.bits });
                setSubmitting(false);
            });
        }
        else if (currentView._type == 'question' && (!currentView._submitted || (solve && !currentView._correct))) {

            setSubmitting(true);

            client.post(`/courses/${courseId}/sections/${sectionId}/lessons/${currentView.lessonId}/progress`, { ...currentView._data, solve }).then(result => {

                if (result.error) {
                    const error = result.error;
                    toast.error(error.message, { id: componentId });
                    setSubmitting(false);
                    return;
                }

                client.updateUser({ bits: result.data.bits });
                setSubmitting(false);
            });

            const answers = JSON.parse(protection.decrypt(appSettings.company.name, currentView.secret));
            const checkAnswer = (inputs) => {
                if (inputs == null) return false;

                const comparator = (a, b) => {
                    return a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })
                  };

                if (currentView.type == 'selectSingle' || currentView.type == 'selectMultiple') {
                    const checkedIds = answers.filter(answer => answer.checked).map(answer => answer.id.toString()).sort(comparator);
                    const inputIds = inputs.map(inputId => inputId.toString()).sort(comparator);
                    return checkedIds.every((checkId, checkIndex) => checkId == inputIds[checkIndex]);
                }
                else if (currentView.type == 'reorder') {
                    const checkedIds = answers.map(answer => answer.id.toString());
                    const inputIds = inputs.map(inputId => inputId.toString());
                    return checkedIds.every((checkId, checkIndex) => checkId == inputIds[checkIndex]);
                }
                else {
                    return false;
                };
            };

            const _correct = solve || checkAnswer(currentView._data.inputs);

            if (_correct) confetti.fire();

            let _alert = _correct ?
                { type: 'success', message: 'Correct answer, Continue!' } :
                { type: 'error', message: 'Wrong answer, Please try again!' };

            if (currentView.type == 'selectSingle' || currentView.type == 'selectMultiple') {
                setCurrentView({
                    ...currentView,
                    answers: currentView.answers.map(answer => ({
                        ...answer,
                        [solve ? 'checked' : undefined]: answers.find(_answer => _answer.id == answer.id).checked,
                        correct: answers.find(_answer => _answer.id == answer.id).checked,
                    })), _correct, _alert, _submitted: true
                });
            }
            else if (currentView.type == 'reorder') {

                setCurrentView({
                    ...currentView,
                    answers: solve ? currentView.answers.sort(function (a, b) {
                        return answers.findIndex(answer => answer.id == a.id) - answers.findIndex(answer => answer.id == b.id);
                    }) : currentView.answers, _correct, _alert, _submitted: true
                });
            }

            return;
        }

        const currentViewIndex = views.findIndex(view => view._id == currentView._id);
        const nextView = views[currentViewIndex + 1];

        if (nextView != null) {
            setCurrentView(nextView);
        }
        else {
            const lastSection = course.sections.slice(-1)[0];

            if ((lastSection && lastSection.id == sectionId) && course.certificateTemplate) {
                router.replace({ pathname: `/courses/${courseId}`, query: { certificate: true } });
            }
            else {
                router.replace(`/courses/${courseId}`);
            }
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
                                    text={currentView.title || ''}
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

            <div className="py-2 px-3 flex-grow-1" style={{ overflowY: "auto" }}>
                {currentView._type == 'lesson' && <LessonView key={currentView.id} {...{ course, lesson: currentView, setCurrentView, moveBackward, moveForward }} />}
                {currentView._type == 'question' && <QuestionView key={currentView.id}  {...{ course, question: currentView, setCurrentView, moveBackward, moveForward }} />}
            </div>

            <div className="py-2 px-3">
                <div className="row justify-content-center g-0 w-100 h-100">
                    <div className="col-12 col-md-8 col-lg-7 col-xl-6">
                        <div className="d-flex gap-3 justify-content-end w-100">
                            {currentView._type == 'question' && !currentView._correct && (
                                <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Find answer</Tooltip>}>
                                    <button className="btn btn-secondary" disabled={submitting} onClick={async () => {
                                        const confirmed = await dialog.confirm({
                                            title: 'Find the answer',
                                            body: <>Use your bits to find the answer. (You have <span className="svg-icon svg-icon-xs d-inline-block me-1"><SvgBitCube /></span>{client.user.bits})</>
                                        });

                                        if (confirmed) {
                                            moveForward(true);
                                        }
                                    }}><div className="d-inline-flex align-items-center"><div className="svg-icon svg-icon-xs"><SvgBitCube /></div><div className="ms-1">{formatNumber(client.user.bits)}</div></div></button>
                                </OverlayTrigger>
                            )}
                            <button className={`btn btn-primary  px-5 w-100 w-sm-auto`} type="button" disabled={(currentView._type == 'question' && !(currentView._data.inputs && currentView._data.inputs.length))} onClick={() => moveForward()}>
                                <div className="position-relative d-flex align-items-center justify-content-center">
                                    <div><div>{currentView._type == 'question' ? (currentView._submitted ? 'Continue' : 'Check answer') : ('Continue')}</div></div>
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