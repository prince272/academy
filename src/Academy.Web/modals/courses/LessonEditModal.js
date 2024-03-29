import { useState, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Form, Modal } from 'react-bootstrap';
import { useForm, Controller as FormController } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { pascalCase } from 'change-case';
import { preventDefault } from '../../utils/helpers';
import { withRemount } from '../../utils/hooks';

import Loader from '../../components/Loader';
import { useClient } from '../../utils/client';
import { useEventDispatcher } from '../../utils/eventDispatcher';

const LessonEditModal = withRemount((props) => {
    const { route, modal, remount } = props;
    const router = useRouter();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [loading, setLoading] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [action, setAction] = useState(route.query.action);
    const courseId = route.query.courseId;
    const sectionId = route.query.sectionId;
    const lessonId = route.query.lessonId;

    const componentId = useMemo(() => _.uniqueId('Component'), []);
    const eventDispatcher = useEventDispatcher();

    const client = useClient();

    const load = async () => {
        if (action == 'edit') {

            setLoading({});

            let result = await client.get(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`);

            if (result.error) {
                const error = result.error;
                setLoading({ ...error, message: 'Unable to load lesson.', fallback: modal.close, remount });
                return;
            }

            form.reset(result.data);

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

            if (result.error) {
                const error = result.error;
                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                toast.error(error.message, { id: componentId });
                setSubmitting(false);
                return;
            }
            
            eventDispatcher.emit(`editCourse`, (await client.get(`/courses/${courseId}`, { throwIfError: true })).data.data);
            toast.success(`Lesson ${action == 'delete' ? (action + 'd') : (action + 'ed')}.`, { id: componentId });
            modal.close();
        })();
    };

    useEffect(() => {
        load();
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
                    </div>
                    {action == 'delete' && <p className="mb-0">Are you sure you want to {action} this lesson?</p>}
                </>
            </Modal.Body>
            <Modal.Footer>
                <div className="d-flex gap-3 justify-content-end w-100">
                    {(action == 'edit') && <button type="button" className="btn btn-danger me-auto" onClick={() => setAction('delete')}>Delete</button>}
                    <button type="button" className="btn btn-outline-secondary" onClick={() => { modal.close(); }}>Cancel</button>

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

export default LessonEditModal;