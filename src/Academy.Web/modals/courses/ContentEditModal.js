import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Form, Modal, OverlayTrigger, Tooltip, Dropdown } from 'react-bootstrap';
import { useForm, Controller as FormController, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { pascalCase } from 'change-case';
import { arrayMove, preventDefault } from '../../utils/helpers';
import { withRemount } from '../../utils/hooks';
import MediaUploader, { MediaExtensions } from '../../components/MediaUploader';
import DocumentEditor from '../../components/DocumentEditor';
import Loader from '../../components/Loader';

import { useClient } from '../../utils/client';
import { useEventDispatcher } from '../../utils/eventDispatcher';

import { BsChevronBarLeft, BsGripVertical, BsThreeDots, BsTrash } from 'react-icons/bs';

import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import _ from 'lodash';

import TextareaAutosize from 'react-textarea-autosize';

const ContentEditModal = withRemount((props) => {
    const { route, modal, updateModalProps, remount } = props;
    const router = useRouter();
    const client = useClient();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [loading, setLoading] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [action, setAction] = useState(route.query.action);
    const courseId = route.query.courseId;
    const sectionId = route.query.sectionId;
    const lessonId = route.query.lessonId;
    const contentId = route.query.contentId;

    const componentId = useMemo(() => _.uniqueId('Component'), []);
    const eventDispatcher = useEventDispatcher();

    const answersController = useFieldArray({
        control: form.control,
        name: 'answers',
        keyName: 'key',
    });

    const handleDragEnd = (reorder) => {
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

        const answers = _.cloneDeep(form.watch('answers'));
        arrayMove(answers, source.index, destination.index);
        answers.forEach((answer, answerIndex) => { answer.index = answerIndex; });

        answersController.remove();
        answersController.append(answers);
    };

    const load = async () => {
        if (action == 'edit') {

            setLoading({});

            let result = await client.get(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/contents/${contentId}`);

            if (result.error) {
                const error = result.error;
                setLoading({ ...error, message: 'Unable to load content.', fallback: modal.close, remount });
                return;
            }

            form.reset(result.data);
            setLoading(null);
        }
        else {

            form.reset({ type: 'explanation', answerType: 'selectSingle' });
            setLoading(null);
        }
    };

    const submit = () => {
        form.handleSubmit(async (inputs) => {

            setSubmitting(true);

            inputs = {
                ...inputs,
                explanation: removePoweredBy(inputs.explanation),
                question: removePoweredBy(inputs.question),
            };

            let result = await ({
                'add': () => client.post(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/contents`, inputs),
                'edit': () => client.put(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/contents/${contentId}`, inputs),
                'delete': () => client.delete(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/contents/${contentId}`)
            })[action]();

            if (result.error) {
                const error = result.error;
                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                toast.error(error.message, { id: componentId });
                setSubmitting(false);
                return;
            }

            eventDispatcher.emit(`editCourse`, (await client.get(`/courses/${courseId}`, { throwIfError: true })).data.data);
            toast.success(`Content ${action == 'delete' ? (action + 'd') : (action + 'ed')}.`, { id: componentId });
            modal.close();
        })();
    };

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        if (action == 'delete') {
            updateModalProps({ size: 'md', contentClassName: '' });
        }
        else {
            updateModalProps(ContentEditModal.getModalProps());
        }

    }, [action]);

    if (loading) return (<Loader {...loading} />);


    const removePoweredBy = function (str) {
        if (str != null) {
            // Otherwise, fallback to old-school method
            var dom = document.getElementById(componentId + '_RAW_HTML') || document.createElement("div");
            dom.id = componentId + '_RAW_HTML';
            dom.innerHTML = str;

            if (dom.lastElementChild &&
                dom.lastElementChild.tagName.toLocaleLowerCase() == 'p' &&
                dom.lastElementChild.getAttribute('data-f-id') === 'pbf') {
                dom.removeChild(dom.lastElementChild);
            }
            return dom.innerHTML;
        }
        else return str;
    };

    return (
        <>
            <Modal.Header closeButton>
                <Modal.Title>{pascalCase(action)} content</Modal.Title>
            </Modal.Header>
            <Modal.Body as={Form} onSubmit={preventDefault(() => submit())}>
                <>
                    <div className={`row g-3 ${action == 'delete' ? 'd-none' : ''}`}>
                        <div className="col-12 col-sm-6">
                            <label className="form-label">Type</label>
                            <select {...form.register("type")} className={`form-select  ${formState.errors.type ? 'is-invalid' : ''}`}>
                                <option value="explanation">Explanation</option>
                                <option value="question">Question</option>
                            </select>
                            <div className="invalid-feedback">{formState.errors.type?.message}</div>
                        </div>
                        {form.watch('type') == 'explanation' && (
                            <>
                                <div className="col-12">
                                    <label className="form-label">Explanation</label>
                                    <FormController name="explanation" control={form.control}
                                        render={({ field }) => {
                                            return (<DocumentEditor value={field.value} onChange={(value) => field.onChange(value)} />);
                                        }} />
                                    <div className="invalid-feedback">{formState.errors.explanation?.message}</div>
                                </div>
                                <div className="col-12">
                                    <label className="form-label">Media</label>
                                    <FormController name="mediaId" control={form.control}
                                        render={({ field }) => {
                                            return (<MediaUploader length={1} value={field.value} onChange={(value) => field.onChange(value)} extensions={[MediaExtensions.VIDEO, MediaExtensions.AUDIO].join(', ')} />);
                                        }} />
                                    <div className="invalid-feedback">{formState.errors.mediaId?.message}</div>
                                </div>
                                <div className="col-12">
                                    <label className="form-label">External media url</label>
                                    <input {...form.register("externalMediaUrl")} className={`form-control  ${formState.errors.externalMediaUrl ? 'is-invalid' : ''}`} />
                                    <div className="invalid-feedback">{formState.errors.externalMediaUrl?.message}</div>
                                </div>
                            </>
                        )}
                        {form.watch('type') == 'question' && (
                            <>
                                <div className="col-12">
                                    <label className="form-label">Question</label>
                                    <FormController name="question" control={form.control}
                                        render={({ field }) => {
                                            return (<DocumentEditor value={field.value} onChange={(value) => field.onChange(value)} />);
                                        }} />
                                    <div className="invalid-feedback">{formState.errors.question?.message}</div>
                                </div>
                                <div className="col-6">
                                    <label className="form-label">Answer type</label>
                                    <FormController name="answerType" control={form.control}
                                        render={({ field }) => {
                                            return (
                                                <select value={field.value} className={`form-select  ${formState.errors.answerType ? 'is-invalid' : ''}`} onChange={(e) => {
                                                    field.onChange(e.target.value);
                                                    answersController.fields.forEach((f, i) => { form.setValue(`answers[${i}].checked`, false); });
                                                }}>
                                                    <option value="selectSingle">Select Single</option>
                                                    <option value="selectMultiple">Select Multiple</option>
                                                    <option value="reorder">Reorder</option>
                                                </select>
                                            );
                                        }} />

                                    <input {...form.register("answerType")} style={{ display: 'none' }} />
                                    <div className="invalid-feedback">{formState.errors.answerType?.message}</div>
                                </div>
                                <div className="col-6">
                                    <div className="d-flex align-items-end justify-content-end w-100 h-100">
                                        <button type="button" className="btn btn-primary" onClick={() => {
                                            answersController.prepend({
                                                id: _.uniqueId(),
                                                text: '',
                                                checked: false,
                                            });
                                        }}>Add answer</button>
                                    </div>
                                </div>
                                {(form.watch('answerType') == 'selectSingle' || form.watch('answerType') == 'selectMultiple' || form.watch('answerType') == 'reorder') && (
                                    <div className="col-12">
                                        <DragDropContext onDragEnd={handleDragEnd}>
                                            <Droppable droppableId={`content`} direction="vertical" type="lesson">
                                                {(provided) => (
                                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                                        {answersController.fields.map((answerField, answerFieldIndex) => {

                                                            return (
                                                                <Draggable key={answerField.key} draggableId={`${answerField.key}`} index={answerFieldIndex}>
                                                                    {(provided) => (
                                                                        <div ref={provided.innerRef} {...provided.draggableProps} className="pb-2">
                                                                            <div className="card">
                                                                                <div className="py-1 d-flex justify-content-between align-items-stretch border-bottom-0">
                                                                                    <div className="px-2 py-1 d-flex align-items-center hstack gap-2">

                                                                                        <div {...provided.dragHandleProps}>
                                                                                            <div className="btn btn-outline-secondary btn-sm btn-icon btn-no-focus border-0">
                                                                                                <span className="svg-icon svg-icon-xs d-inline-block"><BsGripVertical /></span>
                                                                                            </div>
                                                                                        </div>

                                                                                        {(form.watch('answerType') == 'selectSingle' || form.watch('answerType') == 'selectMultiple') && (
                                                                                            <div>
                                                                                                <FormController name={`answers[${answerFieldIndex}].checked`} control={form.control}
                                                                                                    render={({ field }) => {
                                                                                                        return (
                                                                                                            <div className="form-check mb-0">
                                                                                                                <input type="checkbox" className={`form-check-input ${_.get(formState.errors, `answers[${answerFieldIndex}].checked`) ? 'is-invalid' : ''}`} checked={field.value} onChange={(e) => {
                                                                                                                    const answers = form.watch('answers');
                                                                                                                    if (form.watch('answerType') == 'selectSingle') {
                                                                                                                        answers.forEach((answer, answerIndex) => {
                                                                                                                            if (answerIndex != answerFieldIndex)
                                                                                                                                form.setValue(`answers[${answerIndex}].checked`, false);
                                                                                                                        });
                                                                                                                    }

                                                                                                                    field.onChange(e.target.checked);
                                                                                                                }} />
                                                                                                                <label className="form-check-label"></label>
                                                                                                            </div>
                                                                                                        );
                                                                                                    }} />

                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                    <input type="text" {...form.register(`answers[${answerFieldIndex}].id`)} style={{ display: 'none' }} />
                                                                                    <div className="d-flex align-items-center flex-grow-1">
                                                                                        <div className="flex-grow-1">
                                                                                            <input type="text" {...form.register(`answers[${answerFieldIndex}].text`)} className={`form-control ${_.get(formState.errors, `answers[${answerFieldIndex}].text`) ? 'is-invalid' : ''}`} />
                                                                                            <div className="invalid-feedback">{_.get(formState.errors, `answers[${answerFieldIndex}].text`)?.message}</div>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="px-2 py-1 d-flex align-items-center hstack gap-2">
                                                                                        <div>
                                                                                            <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Delete answer</Tooltip>}>
                                                                                                <button type="button" className="btn btn-outline-secondary btn-sm btn-icon border-0" onClick={() => {
                                                                                                    answersController.remove(answerFieldIndex);
                                                                                                }}>
                                                                                                    <span className="svg-icon svg-icon-xs d-inline-block"><BsTrash /></span>
                                                                                                </button>
                                                                                            </OverlayTrigger>
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
                                    </div>
                                )}
                                {(form.watch('answerMode') == 'typing') && (
                                    <div className="col-12">
                                        <label className="form-label">Answer text</label>
                                        <input {...form.register("answerText")} className={`form-control  ${formState.errors.answerText ? 'is-invalid' : ''}`} />
                                        <div className="invalid-feedback">{formState.errors.answerText?.message}</div>
                                    </div>
                                )}
                            </>
                        )}

                    </div>
                    {action == 'delete' && <p className="mb-0">Are you sure you want to {action} this content?</p>}
                </>
            </Modal.Body>
            <Modal.Footer>
                <div className="d-flex gap-3 justify-content-end w-100">
                    {(action == 'edit') && <button type="button" className="btn btn-danger me-auto" onClick={() => setAction('delete')}>Delete</button>}
                    <button type="button" className="btn btn-secondary" onClick={() => { modal.close(); }}>Cancel</button>

                    <button className={`btn btn-${action == 'delete' ? 'danger' : 'primary'}`} type="button" onClick={() => submit()} disabled={submitting}>
                        <div className="position-relative d-flex align-items-center justify-content-center">
                            <div className={`${submitting ? 'invisible' : ''}`}>{action == 'delete' ? 'Delete' : 'Save'}</div>
                            {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                        </div>
                    </button>
                </div>
            </Modal.Footer>
        </>
    );
});

ContentEditModal.getModalProps = () => {
    return {
        contentClassName: 'h-100',
        size: 'lg',
    };
};

export default ContentEditModal;