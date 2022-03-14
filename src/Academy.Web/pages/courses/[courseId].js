import router, { useRouter } from 'next/router';
import { AspectRatio } from 'react-aspect-ratio';
import Image from 'next/image';
import { forwardRef, useEffect, useState } from 'react';
import Loader from '../../components/Loader';
import { NextSeo } from 'next-seo';

import LinesEllipsis from 'react-lines-ellipsis';
import responsiveHOC from 'react-lines-ellipsis/lib/responsiveHOC';
const ResponsiveEllipsis = withRemount(responsiveHOC()(LinesEllipsis), 1000);

import { BsGripVertical, BsCardImage, BsChevronDown, BsChevronRight, BsPlus, BsThreeDots, BsCheck2, BsLockFill, BsX, BsPlayFill, BsFilm, BsJournalRichtext, BsMusicNoteBeamed, BsChevronLeft, BsAward, BsHourglassBottom, BsClockHistory, BsClockFill, BsCart, BsCart2, BsBasket2, BsCart4, BsCart3 } from 'react-icons/bs';
import { Collapse, Dropdown, OverlayTrigger, Tooltip, ProgressBar } from 'react-bootstrap';
import Link from 'next/link';
import { useClient } from '../../utils/client';
import { useRouterQuery } from 'next-router-query';
import { ModalPathPrefix, useModal } from '../../modals';

import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { arrayMove, arrayTransfer, preventDefault, stopPropagation, stripHtml } from '../../utils/helpers';
import { pascalCase } from 'change-case';
import { withRemount } from '../../utils/hooks';

import * as moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
momentDurationFormatSetup(moment);

import * as Scroll from 'react-scroll';
import { useAppSettings } from '../../utils/appSettings';
import { useDialog } from '../../utils/dialog';
import CertificateViewDialog from '../../modals/courses/CertificateViewDialog';
import { useEventDispatcher } from '../../utils/eventDispatcher';

const QuestionItem = ({ course, section, lesson, question, permitted }) => {
    const courseId = course.id;
    const client = useClient();
    const router = useRouter();

    return (
        <Draggable draggableId={`question_${question.id}`} index={question.index}>
            {(provided) => (
                <div ref={provided.innerRef} {...provided.draggableProps} className="pb-3">
                    <div className="card border-0 shadow-sm">
                        <div className="py-1 d-flex justify-content-between align-items-stretch border-bottom-0" style={{ height: "53px" }}>
                            <div className="px-2 py-1 d-flex align-items-center hstack gap-2">

                                <div {...provided.dragHandleProps} className={`${!(permitted) && 'd-none'}`}>
                                    <div className="btn btn-outline-secondary btn-sm btn-icon btn-no-focus border-0">
                                        <span className="svg-icon svg-icon-xs d-inline-block" ><BsGripVertical /></span>
                                    </div>
                                </div>

                            </div>

                            <div className="d-flex align-items-center flex-grow-1 cursor-default">
                                <div className="flex-grow-1">
                                    <ResponsiveEllipsis
                                        text={`${question.index + 1}. ${stripHtml(question.text)}`}
                                        maxLine="1"
                                        ellipsis="..."
                                        trimRight
                                        basedOn="letters"
                                    />
                                </div>
                            </div>
                            <div className="px-2 py-1 d-flex align-items-center hstack gap-2" style={{ minHeight: "37px" }}>
                                {client.user && (
                                    <>
                                        {question.status == 'completed' && (
                                            <div>
                                                <div className={`text-${(question.choices[0] ? 'success' : 'danger')} d-flex justify-content-center align-items-center`} style={{ height: "32px", width: "32px" }}>
                                                    <span className="svg-icon svg-icon-sm d-inline-block" >{question.choices[0] ? <BsCheck2 /> : <BsX />}</span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                {(permitted) && (
                                    <div>
                                        <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Options</Tooltip>}>
                                            {({ ...triggerHandler }) => (
                                                <Dropdown>
                                                    <Dropdown.Toggle {...triggerHandler} variant="outline-secondary" size="sm" bsPrefix=" " className="btn-icon btn-no-focus border-0">
                                                        <span className="svg-icon svg-icon-xs d-inline-block" ><BsThreeDots /></span>
                                                    </Dropdown.Toggle>

                                                    <Dropdown.Menu style={{ margin: 0 }}>
                                                        <Link href={`${ModalPathPrefix}/courses/${courseId}/sections/${section.id}/lessons/${lesson.id}/questions/${question.id}/edit`} passHref><Dropdown.Item>Edit</Dropdown.Item></Link>
                                                        <Link href={`${ModalPathPrefix}/courses/${courseId}/sections/${section.id}/lessons/${lesson.id}/questions/${question.id}/delete`} passHref><Dropdown.Item>Delete</Dropdown.Item></Link>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            )}
                                        </OverlayTrigger>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

const QuestionList = ({ course, section, lesson, permitted }) => {
    const courseId = course.id;
    const client = useClient();

    return (
        <div className="px-2 py-2">
            <Droppable droppableId={`question_${lesson.id}`} direction="vertical" type="question">
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        {lesson.questions.map((question, questionIndex) => {
                            return (<QuestionItem key={question.id} {...{ course, section, lesson, question: { ...question, index: questionIndex }, permitted }} />);
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
            {(permitted) && (
                <div className="d-flex flex-column text-center justify-content-center">
                    <Link href={`${ModalPathPrefix}/courses/${courseId}/sections/${section.id}/lessons/${lesson.id}/questions/add`}>
                        <a className="btn btn-outline-secondary btn-no-focus border-0 w-100 border-top-0"><span className="svg-icon svg-icon-xs d-inline-block me-1" ><BsPlus /></span>Add question</a>
                    </Link>
                </div>
            )}
        </div>
    );
}

const LessonItem = ({ course, section, lesson, toggler, permitted }) => {
    const courseId = course.id;
    const client = useClient();
    const disabled = !permitted && lesson.status == 'locked';

    return (
        <Draggable draggableId={`lesson_${lesson.id}`} index={lesson.index}>
            {(provided) => (
                <div ref={provided.innerRef} {...provided.draggableProps} className="pb-3">
                    <Scroll.Element name={`lesson_${lesson.id}`} className={`card text-body bg-light ${disabled ? 'opacity-75' : 'btn-outline-primary'}`}>
                        <div className="p-0 d-flex justify-content-between align-items-stretch border-bottom-0" style={{ height: "72px" }}>
                            <div className="p-2 d-flex align-items-center hstack gap-2">
                                <div {...provided.dragHandleProps} className={`${!(permitted) && 'd-none'}`}>
                                    <div className="btn btn-outline-secondary btn-sm btn-icon btn-no-focus border-0">
                                        <span className="svg-icon svg-icon-xs d-inline-block" ><BsGripVertical /></span>
                                    </div>
                                </div>
                            </div>
                            <div className="d-flex align-items-center flex-grow-1 cursor-default" onClick={() => { if (!disabled) router.push(`${ModalPathPrefix}/courses/${courseId}/sections/${section.id}/lessons/${lesson.id}`); }}>
                                <div className="flex-grow-1">
                                    <div className="mb-1">
                                        <div className="fw-bold">
                                            <ResponsiveEllipsis
                                                text={lesson.title || ''}
                                                maxLine="1"
                                                ellipsis="..."
                                                trimRight
                                                basedOn="letters"
                                            />
                                        </div>
                                    </div>
                                    <div className="small text-body d-flex align-items-center">
                                        {
                                            [
                                                (lesson.media != null) ? (<span key="1">{lesson.media.type == 'video' ? <BsFilm size="1rem" /> : lesson.media.type == 'audio' ? <BsMusicNoteBeamed size="1rem" /> : <></>} {pascalCase(lesson.media.type)}</span>) : null,
                                                (<a key="2" className="text-body" href="#" onClick={preventDefault(stopPropagation(() => toggler.toggle(`lesson_${lesson.id}`)))}><BsJournalRichtext size="1rem" /> {lesson.questions.length} {lesson.questions.length > 1 ? 'Questions' : 'Question'}</a>),
                                            ].filter(curr => curr != null).reduce((prev, curr) => [prev, (<span key="0" className="mx-2">·</span>), curr])
                                        }
                                    </div>
                                </div>
                                <div className={`p-0 d-flex align-items-center rounded-pill text-white bg-${lesson.status == 'completed' ? 'success' : lesson.status == 'started' ? 'primary' : 'dark'}`}>
                                    <div className={`rounded-pill d-flex justify-content-center align-items-center`} style={{ height: "32px", width: "32px" }}>
                                        <span className="svg-icon svg-icon-xs d-inline-block" >{lesson.status == 'completed' ? <BsCheck2 /> : lesson.status == 'started' ? (course.price > 0 && !course.purchased ? <BsCart3 /> : <BsPlayFill />) : <BsLockFill />}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-2 d-flex align-items-center hstack gap-2">
                                {(permitted) && (
                                    <div>
                                        <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Options</Tooltip>}>
                                            {({ ...triggerHandler }) => (
                                                <Dropdown>
                                                    <Dropdown.Toggle {...triggerHandler} variant="outline-secondary" size="sm" bsPrefix=" " className="btn-icon btn-no-focus border-0">
                                                        <span className="svg-icon svg-icon-xs d-inline-block" ><BsThreeDots /></span>
                                                    </Dropdown.Toggle>

                                                    <Dropdown.Menu style={{ margin: 0 }}>
                                                        <Link href={`${ModalPathPrefix}/courses/${courseId}/sections/${section.id}/lessons/${lesson.id}`} passHref><Dropdown.Item>View</Dropdown.Item></Link>
                                                        <Link href={`${ModalPathPrefix}/courses/${courseId}/sections/${section.id}/lessons/${lesson.id}/edit`} passHref><Dropdown.Item>Edit</Dropdown.Item></Link>
                                                        <Link href={`${ModalPathPrefix}/courses/${courseId}/sections/${section.id}/lessons/${lesson.id}/delete`} passHref><Dropdown.Item>Delete</Dropdown.Item></Link>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            )}
                                        </OverlayTrigger>
                                    </div>
                                )}

                                <div className="d-none">
                                    <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>{toggler.in(`lesson_${lesson.id}`) ? 'Collapse' : 'Expand'} </Tooltip>}>
                                        <div className="btn btn-outline-secondary btn-sm btn-icon btn-no-focus border-0" onClick={() => toggler.toggle(`lesson_${lesson.id}`)}>
                                            <span className="svg-icon svg-icon-xs d-inline-block" >
                                                {toggler.in(`lesson_${lesson.id}`) ? <BsChevronDown /> : <BsChevronRight />}
                                            </span>
                                        </div>
                                    </OverlayTrigger>
                                </div>
                            </div>
                        </div>
                        <Collapse in={toggler.in(`lesson_${lesson.id}`)}>
                            <div>
                                <QuestionList {...{ course, section, lesson, permitted }} />
                            </div>
                        </Collapse>
                    </Scroll.Element>
                </div>
            )}
        </Draggable>
    );
};

const LessonList = ({ course, section, permitted, toggler }) => {
    const courseId = course.id;
    const client = useClient();

    return (
        <div className="px-3 px-sm-4 pb-3">
            <Droppable droppableId={`lesson_${section.id}`} direction="vertical" type="lesson">
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        {section.lessons.map((lesson, lessonIndex) => {
                            return (<LessonItem key={lesson.id} {...{ course, section, lesson: { ...lesson, index: lessonIndex }, toggler, permitted }} />);
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
            {(permitted) && (
                <div className="d-flex flex-column text-center justify-content-center">
                    <Link href={`${ModalPathPrefix}/courses/${courseId}/sections/${section.id}/lessons/add`}>
                        <a className="btn btn-outline-secondary btn-no-focus border-0 w-100 border-top-0"><span className="svg-icon svg-icon-xs d-inline-block me-1" ><BsPlus /></span>Add lesson</a>
                    </Link>
                </div>
            )}
        </div>
    );
};

const SectionItem = ({ course, section, toggler, permitted }) => {
    const courseId = course.id;
    const client = useClient();

    return (
        <Draggable draggableId={`section_${section.id}`} index={section.index}>
            {(provided) => (
                <div ref={provided.innerRef} {...provided.draggableProps} className="pb-3">
                    <div className="card shadow-sm">
                        <div className="py-1 d-flex justify-content-between align-items-stretch">

                            <div className="p-2 d-flex align-items-center hstack gap-2">

                                <div {...provided.dragHandleProps} className={`${!(permitted) && 'd-none'}`}>
                                    <div className="btn btn-outline-secondary btn-sm btn-icon btn-no-focus border-0">
                                        <span className="svg-icon svg-icon-xs d-inline-block" ><BsGripVertical /></span>
                                    </div>
                                </div>

                            </div>

                            <div className="d-flex align-items-center flex-grow-1 cursor-default" onClick={() => toggler.toggle(`section_${section.id}`)}>
                                <div className="flex-grow-1">
                                    <ResponsiveEllipsis
                                        text={section.title || ''}
                                        maxLine="1"
                                        ellipsis="..."
                                        trimRight
                                        basedOn="letters"
                                    />
                                </div>
                            </div>

                            <div className="p-2 d-flex align-items-center hstack gap-2">
                                {(permitted) && (
                                    <div>
                                        <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Options</Tooltip>}>
                                            {({ ...triggerHandler }) => (
                                                <Dropdown>
                                                    <Dropdown.Toggle {...triggerHandler} variant="outline-secondary" size="sm" bsPrefix=" " className="btn-icon btn-no-focus border-0">
                                                        <span className="svg-icon svg-icon-xs d-inline-block" ><BsThreeDots /></span>
                                                    </Dropdown.Toggle>

                                                    <Dropdown.Menu style={{ margin: 0 }}>
                                                        <Link href={`${ModalPathPrefix}/courses/${courseId}/sections/${section.id}/edit`} passHref><Dropdown.Item>Edit</Dropdown.Item></Link>
                                                        <Link href={`${ModalPathPrefix}/courses/${courseId}/sections/${section.id}/delete`} passHref><Dropdown.Item>Delete</Dropdown.Item></Link>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            )}
                                        </OverlayTrigger>
                                    </div>
                                )}
                                <div>
                                    <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>{toggler.in(`section_${section.id}`) ? 'Collapse' : 'Expand'} </Tooltip>}>
                                        <div className="btn btn-outline-secondary btn-sm btn-icon btn-no-focus border-0" onClick={() => toggler.toggle(`section_${section.id}`)}>
                                            <span className="svg-icon svg-icon-xs d-inline-block" >
                                                {toggler.in(`section_${section.id}`) ? <BsChevronDown /> : <BsChevronRight />}
                                            </span>
                                        </div>
                                    </OverlayTrigger>
                                </div>
                            </div>
                        </div>
                        <Collapse in={toggler.in(`section_${section.id}`)}>
                            <div>
                                <LessonList {...{ course, section, toggler, permitted }} />
                            </div>
                        </Collapse>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

const SectionList = ({ course, setCourse, toggler, permitted }) => {
    const courseId = course.id;
    const client = useClient();

    useEffect(() => {
        toggler.set(course.sections.map((section, index) => ({
            id: `section_${section.id}`,
            value: section.status == 'started'
        })))
    }, []);

    const handleDragEnd = (reorder) => {
        const { source, destination, type } = reorder;

        if (!source || !destination)
            return;

        source.id = source.droppableId.replace(`${type}_`, '');
        delete source.droppableId;

        destination.id = destination.droppableId.replace(`${type}_`, '');
        delete destination.droppableId;

        if (source.id == destination.id &&
            source.index == destination.index)
            return;

        if (type == 'section') {
            setCourse(course => {
                const sections = _.cloneDeep(course.sections);

                arrayMove(sections, source.index, destination.index);
                sections.forEach((section, sectionIndex) => { section.index = sectionIndex; });

                return { ...course, sections };
            });
        }
        else if (type == 'lesson') {

            setCourse(course => {
                const sections = _.cloneDeep(course.sections);

                const sourceSection = sections.find(section => section.id == source.id);
                const destinationSection = sections.find(section => section.id == destination.id);

                const sourceLessons = sourceSection.lessons;
                const destinationLessons = destinationSection.lessons;

                if (sourceSection == destinationSection) {
                    arrayMove(sourceLessons, source.index, destination.index);
                    sourceLessons.forEach((lesson, lessonIndex) => { lesson.index = lessonIndex; });
                }
                else {

                    arrayTransfer(sourceLessons, source.index, destination.index, destinationLessons);
                    sourceLessons.forEach((lesson, lessonIndex) => {
                        lesson.sectionId = sourceSection.id;
                        lesson.index = lessonIndex;
                    });
                    destinationLessons.forEach((lesson, lessonIndex) => {
                        lesson.sectionId = destinationSection.id;
                        lesson.index = lessonIndex;
                    });
                }

                return { ...course, sections };
            });
        }
        else if (type == 'question') {

            setCourse(course => {
                const sections = _.cloneDeep(course.sections);

                const sourceLesson = sections.flatMap(section => section.lessons).find(lesson => lesson.id == source.id);
                const destinationLesson = sections.flatMap(section => section.lessons).find(lesson => lesson.id == destination.id);

                const sourceQuestions = sourceLesson.questions;
                const destinationQuestions = destinationLesson.questions;

                if (sourceLesson == destinationLesson) {
                    arrayMove(sourceQuestions, source.index, destination.index);
                    sourceQuestions.forEach((question, questionIndex) => { question.index = questionIndex; });
                }
                else {

                    arrayTransfer(sourceQuestions, source.index, destination.index, destinationQuestions);
                    sourceQuestions.forEach((question, questionIndex) => {
                        question.lessonId = sourceLesson.id;
                        question.index = questionIndex;
                    });
                    destinationQuestions.forEach((question, questionIndex) => {
                        question.lessonId = destinationLesson.id;
                        question.index = questionIndex;
                    });
                }

                return { ...course, sections };
            });
        }

        client.post(`/courses/${courseId}/reorder`, { source, destination, type });
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={`section_${courseId}`} direction="vertical" type="section">
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        {course.sections.map((section, sectionIndex) => {
                            return (<SectionItem key={section.id} {...{ course, section: { ...section, index: sectionIndex }, toggler, permitted }} />);
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    )
}

const CoursePage = withRemount(({ remount }) => {
    const modal = useModal();
    const router = useRouter()
    const { courseId } = useRouterQuery();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState({});

    const appSettings = useAppSettings();
    const client = useClient();

    const eventDispatcher = useEventDispatcher();

    const dialog = useDialog();

    const [toggles, setToggles] = useState([]);
    const toggler = {
        in: (toggleId) => {
            return toggles.find(_toggle => _toggle.id == toggleId)?.value;
        },
        toggle: (toggleId, toggleValue) => {
            const toggle = {
                id: toggleId,
                value: (toggleValue !== undefined) ? toggleValue : !toggles.find(_toggle => _toggle.id == toggleId)?.value
            };
            setToggles(_.unionBy([toggle], toggles, 'id'));
        },
        set: setToggles
    };

    const load = async () => {

        setLoading({});

        let result = await client.get(`/courses/${courseId}`);

        if (result.error) {
            const error = result.error;
            setLoading({ ...error, message: 'Unable to load course.', remount });
            return;
        }

        setCourse(result.data);
        setLoading(null);
    };

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        const handleEditCourse = (course) => {
            setCourse(course);
        };
        const handleDeleteCourse = () => {
            router.replace('/courses');
        };

        eventDispatcher.on('editCourse', handleEditCourse);
        eventDispatcher.on('deleteCourse', handleDeleteCourse);

        return () => {
            eventDispatcher.off('editCourse', handleEditCourse);
            eventDispatcher.off('deleteCourse', handleDeleteCourse);
        }
    }, []);

    useEffect(() => {

        const handleSigninComplete = (state) => {
            remount();
        };

        const handleSignoutComplete = (state) => {
            remount();
        };

        eventDispatcher.on('signinComplete', handleSigninComplete);
        eventDispatcher.on('signoutComplete', handleSignoutComplete);

        return () => {
            eventDispatcher.off('signinComplete', handleSigninComplete);
            eventDispatcher.off('signoutComplete', handleSignoutComplete);
        };
    }, []);

    if (loading) return (<Loader {...loading} />);

    const permitted = (client.user && (client.user.roles.some(role => role == 'manager') || (client.user.roles.some(role => role == 'teacher') && course.userId == client.user.id)));

    return (
        <>
            <div className="bg-dark position-absolute w-100" style={{ height: "350px" }}></div>
            <div className="container position-relative zi-1 h-100">
                <div className="row justify-content-center h-100">
                    <div className="col-12 col-md-9 align-self-start">
                        <div className="pt-4 pb-5">
                            <div className="mb-4"><Link href="/courses"><a className="link-light d-inline-flex align-items-center"><div className="svg-icon svg-icon-xs me-1"><BsChevronLeft /></div><div>Back to courses</div></a></Link></div>
                            <div className="d-flex align-items-start">
                                <div className="flex-shrink-0" style={{ width: "96px", height: "96px" }}>
                                    <AspectRatio ratio="1">
                                        {course.image ?
                                            (<Image className="rounded" priority unoptimized loader={({ src }) => src} src={course.image.url} layout="fill" objectFit="cover" alt={course.title} />) :
                                            (<div className="rounded svg-icon svg-icon-lg text-muted bg-light d-flex justify-content-center align-items-center"><BsCardImage /></div>)}
                                    </AspectRatio>
                                </div>
                                <div className="flex-grow-1 ms-3 text-white">
                                    <div className="hstack gap-2 flex-wrap mb-2"><div className="badge text-dark bg-white">{appSettings.course.subjects.find(subject => course.subject == subject.value)?.name}</div>{course.purchased && <div className="badge text-white bg-primary">Purchased</div>}</div>
                                    <div className="d-flex align-items-center mb-1">
                                        <div className="h5 text-white mb-0 w-100">
                                            <ResponsiveEllipsis
                                                text={course.title || ''}
                                                maxLine="1"
                                                ellipsis="..."
                                                trimRight
                                                basedOn="letters"
                                            />
                                        </div>
                                    </div>
                                    <div className="hstack">
                                        <div className="text-primary">{course.price > 0 ? (<span className="text-nowrap"><span>{appSettings.currency.symbol}</span> {course.price}</span>) : (<span>Free</span>)}</div>
                                        <span className="mx-2">·</span>
                                        <div><span><BsClockFill /></span> {moment.duration(Math.floor(course.duration / 10000)).format("w[w] d[d] h[h] m[m]", { trim: "both", largest: 1 })}</div>
                                    </div>
                                    <div className="mb-1">
                                        <ResponsiveEllipsis
                                            text={course.description || ''}
                                            maxLine="3"
                                            ellipsis="..."
                                            trimRight
                                            basedOn="letters"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <SectionList {...{ course, setCourse, toggler, permitted }} />
                    </div>

                    {course.certificateTemplate && (
                        <div className="col-12 col-md-9 align-self-end">
                            <div className="card">
                                <div className="card-body">
                                    <h1 className="h5 mb-3">Certification</h1>
                                    <div className="hstack gap-3 align-items-center">
                                        <div className={`svg-icon svg-icon-lg ${(course.status == 'completed') ? 'bg-soft-primary text-primary' : 'bg-light text-muted'} p-3 mb-3`}><BsAward /></div>
                                        <div className="flex-grow-1 mb-3">
                                            <div className="mb-2">{(course.status == 'completed') ? 'We are happy to present your certificate to you for completing this course.' : 'Complete the course to get a certificate. A certificate is a valuable way to prove what you\'ve learnt.'}</div>
                                            <div className="hstack gap-2"><ProgressBar className="flex-grow-1" now={(course.progress * 100).toFixed(0)} style={{ height: "6px" }} /><div>{(course.progress * 100).toFixed(0)}%</div></div>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-3 justify-content-end w-100">
                                        <button className={`btn btn-${(course.status == 'completed') ? 'primary' : 'secondary'} px-5 w-100 w-sm-auto`} disabled={!(course.status == 'completed')} type="button" onClick={() => { dialog.open({ course }, CertificateViewDialog); }}>Get certificate</button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
            {permitted &&
                (<div className="position-fixed bottom-0 end-0 w-100 zi-3 pe-none">
                    <div className="container py-3">
                        <div className="row justify-content-center">
                            <div className="col-12">
                                <div className="d-flex justify-content-end">
                                    <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Add section</Tooltip>}>
                                        {({ ...triggerHandler }) => (

                                            <Link href={`${ModalPathPrefix}/courses/${courseId}/sections/add`}>
                                                <a className="btn btn-primary btn-icon rounded-pill pe-auto" {...triggerHandler}>
                                                    <span className="svg-icon svg-icon-sm d-inline-block" ><BsPlus /></span>
                                                </a>
                                            </Link>
                                        )}
                                    </OverlayTrigger>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                )
            }
        </>
    )
});

CoursePage.getPageSettings = () => {
    return ({
        showFooter: false
    });
}

export default CoursePage;