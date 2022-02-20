import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Form, Modal } from 'react-bootstrap';
import { useForm, Controller as FormController } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { pascalCase } from 'change-case';
import { preventDefault } from '../../utils/helpers';
import { withRemount } from '../../utils/hooks';
import MediaUploader, { MediaExtensions } from '../../components/MediaUploader';

import DocumentEditor from '../../components/document-editor/DocumentEditor';
import Loader from '../../components/Loader';

import { useClient } from '../../utils/client';

const LessonEditModal = withRemount((props) => {
    const { route, modal, updateModalProps, remount } = props;
    const router = useRouter();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [loading, setLoading] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [action, setAction] = useState(route.query.action);
    const courseId = route.query.courseId;
    const sectionId = route.query.sectionId;
    const lessonId = route.query.lessonId;

    const client = useClient();

    const prepareModal = async () => {
        if (action == 'edit') {

            setLoading({});

            let result = await client.get(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`);

            if (result.error) {
                const error = result.error;
                setLoading({ ...error, message: 'Unable to load lesson.', fallback: modal.close, remount });
                return;
            }

            form.reset({
                ...result.data, 
                mediaId: result.data.media?.id,
            });

            setLoading(null);
        }
        else {
            setLoading(null);
        }
    };

    const submit = () => {
        form.handleSubmit(async (inputs) => {

            setSubmitting(true);

            let result = await ({
                'add': () => client.post(`/courses/${courseId}/sections/${sectionId}/lessons`, inputs),
                'edit': () => client.put(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, inputs),
                'delete': () => client.delete(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`)
            })[action]();

            setSubmitting(false);

            if (result.error) {
                const error = result.error;

                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                toast.error(error.message);
                return;
            }

            toast.success(`Lesson ${action == 'delete' ? (action + 'd') : (action + 'ed')}.`);
            modal.events.emit(`editCourse`, { id: courseId, ...result.data });
            modal.close();
        })();
    };

    useEffect(() => {
        if (action == 'delete') {
            updateModalProps({ size: 'md', contentClassName: '' });
        }
        else {
            updateModalProps(LessonEditModal.getModalProps());
        }

    }, [action]);

    useEffect(() => {
        prepareModal();
    }, []);

    if (loading) return (<Loader {...loading} />);

    return (
        <>
            <Modal.Header closeButton>
                <Modal.Title>{pascalCase(action)} lesson</Modal.Title>
            </Modal.Header>
            <Modal.Body as={Form} onSubmit={preventDefault(() => submit())}>
                <>
                    <div className={`row g-3 ${action == 'delete' ? 'd-none' : ''}`}>
                        <div className="col-12">
                            <label className="form-label">Title</label>
                            <input {...form.register("title")} className={`form-control  ${formState.errors.title ? 'is-invalid' : ''}`} />
                            <div className="invalid-feedback">{formState.errors.title?.message}</div>
                        </div>
                        <div className="col-12">
                            <label className="form-label">Document</label>
                            <FormController name="document" control={form.control}
                                render={({ field }) => {
                                    return (<DocumentEditor value={field.value} onChange={(value) => field.onChange(value)} />);
                                }} />
                            <div className="invalid-feedback">{formState.errors.document?.message}</div>
                        </div>
                        <div className="col-12">
                            <label className="form-label">Media</label>
                            <FormController name="mediaId" control={form.control}
                                render={({ field }) => {
                                    return (<MediaUploader length={1} value={field.value} onChange={(value) => field.onChange(value)} extensions={[MediaExtensions.VIDEO, MediaExtensions.AUDIO].join(', ')} />);
                                }} />
                            <div className="invalid-feedback">{formState.errors.mediaId?.message}</div>
                        </div>
                    </div>
                    {action == 'delete' && <p className="mb-0">Are you sure you want to {action} this lesson?</p>}
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

LessonEditModal.getModalProps = () => {
    return {
        contentClassName: 'h-100',
        size: 'lg',
    };
};

export default LessonEditModal;