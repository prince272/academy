import { useState, useCallback, useEffect, useMemo, useImperativeHandle } from 'react';
import Link from 'next/link';
import { Form, Modal, OverlayTrigger, Popover } from 'react-bootstrap';
import { useForm, Controller as FormController } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { pascalCase } from 'change-case';
import { preventDefault } from '../../utils/helpers';

import Cleave from 'cleave.js/react';

import Loader from '../../components/Loader';
import { useClient } from '../../utils/client';
import { withRemount } from '../../utils/hooks';
import MediaUploader, { MediaExtensions } from '../../components/MediaUploader';
import { BsInfoCircle } from 'react-icons/bs';
import { useSettings } from '../../utils/settings';

const CourseEditModal = withRemount((props) => {
    const { route, modal, remount, updateModalProps } = props;
    const router = useRouter();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [loading, setLoading] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [action, setAction] = useState(route.query.action);
    const courseId = route.query.courseId;

    const settings = useSettings();

    const client = useClient();

    const prepareModal = async () => {
        if (action == 'edit') {

            setLoading({});

            let result = await client.get(`/courses/${courseId}`);

            if (result.error) {
                const error = result.error;

                setLoading({ ...error, message: 'Unable to load course.', fallback: modal.close, remount });
                return;
            }

            form.reset({ ...result.data, published: !!result.data.published });
            setLoading(null);
        }
        else {
            form.reset({ cost: 0 });
            setLoading(null);
        }
    };

    const submit = () => {
        form.handleSubmit(async (inputs) => {

            setSubmitting(true);

            let result = await ({
                'add': () => client.post(`/courses`, inputs),
                'edit': () => client.put(`/courses/${courseId}`, inputs),
                'delete': () => client.delete(`/courses/${courseId}`)
            })[action]();

            setSubmitting(false);

            if (result.error) {
                const error = result.error;

                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));

                toast.error(error.message);
                return;
            }

            toast.success(`Course ${action == 'delete' ? (action + 'd') : (action + 'ed')}.`);
            modal.events.emit(`${action}Course`, { id: courseId, ...result.data });
            modal.close();
        })();
    };

    useEffect(() => {
        if (action == 'delete') {
            updateModalProps({ size: 'md', contentClassName: '' });
        }
        else {
            updateModalProps(CourseEditModal.getModalProps());
        }

    }, [action]);

    useEffect(() => {
        prepareModal();
    }, []);

    if (loading) return (<Loader {...loading} />);

    return (
        <>
            <Modal.Header closeButton>
                <Modal.Title>{pascalCase(action)} course</Modal.Title>
            </Modal.Header>
            <Modal.Body as={Form} onSubmit={preventDefault(() => submit())}>
                <>
                    <div className={`row g-3 ${action == 'delete' ? 'd-none' : ''}`}>
                        <div className="col-12">
                            <label className="form-label">Title</label>
                            <input {...form.register("title")} className={`form-control  ${formState.errors.title ? 'is-invalid' : ''}`} />
                            <div className="invalid-feedback">{formState.errors.title?.message}</div>
                        </div>
                        <div className="col-12 col-sm-6">
                            <label className="form-label">Subject</label>
                            <select {...form.register("subject")} className={`form-select  ${formState.errors.type ? 'is-invalid' : ''}`}>
                                {settings.courseSubjects.map((subject) => (
                                    <option value={subject.value}>{subject.name}</option>
                                ))}
                            </select>
                            <div className="invalid-feedback">{formState.errors.type?.message}</div>
                        </div>
                        <div className="col-12">
                            <FormController name={`published`} control={form.control}
                                render={({ field }) => {
                                    return (
                                        <div className="form-check">
                                            <input type="checkbox" className={`form-check-input ${formState.errors.published ? 'is-invalid' : ''}`} checked={field.value} onChange={(e) => {
                                                field.onChange(e.target.checked);
                                            }} />
                                            <label className="form-check-label" onClick={() => field.onChange(!field.value)}>Show this course to the public</label>
                                        </div>
                                    );
                                }} />
                        </div>
                        <div className="col-12">
                            <label className="form-label">Description</label>
                            <textarea {...form.register("description")} className={`form-control  ${formState.errors.description ? 'is-invalid' : ''}`} rows="4" />
                            <div className="invalid-feedback">{formState.errors.description?.message}</div>
                        </div>
                        <div className="col-7">
                            <label className="form-label">Cost
                                <OverlayTrigger trigger="hover" rootClose placement="top" overlay={(popoverProps) => (
                                    <Popover {...popoverProps} arrowProps={{ style: { display: "none" } }}>
                                        <Popover.Body className="p-3">
                                            <div className="small">The expense incurred for making this course. The actual price of the course would be automatically calculated depending on our policies.</div>
                                        </Popover.Body>
                                    </Popover>

                                )}>
                                    <span className="link-primary svg-icon svg-icon-xs d-inline-block mx-1"><BsInfoCircle /></span>
                                </OverlayTrigger>
                                (<span>{form.watch('cost') != 0 ? 'paid' : 'free'}</span> course)
                            </label>
                            <div class="input-group input-group-merge">
                                <div class="input-group-prepend input-group-text">{settings.currency.symbol}</div>
                                <FormController name="cost" control={form.control}
                                    render={({ field }) => {
                                        return (
                                            <Cleave value={field.value}
                                                options={{ numeral: true, numeralThousandsGroupStyle: "thousand" }}
                                                onChange={(value) => field.onChange(value)} className={`form-control  ${formState.errors.fee ? 'is-invalid' : ''}`} />
                                        );
                                    }} />
                            </div>
                            <div className="invalid-feedback">{formState.errors.cost?.message}</div>
                        </div>
                        <div className="col-12">
                            <label className="form-label">Image</label>
                            <FormController name="imageId" control={form.control}
                                render={({ field }) => {
                                    return (<MediaUploader length={1} value={field.value} onChange={(value) => field.onChange(value)} extensions={MediaExtensions.IMAGE} />);
                                }} />
                            <div className="invalid-feedback">{formState.errors.imageId?.message}</div>
                        </div>
                        <div className="col-12">
                            <label className="form-label">Certificate template</label>
                            <FormController name="certificateTemplateId" control={form.control}
                                render={({ field }) => {
                                    return (<MediaUploader length={1} value={field.value} onChange={(value) => field.onChange(value)} extensions={'.doc, .docx'} />);
                                }} />
                            <div className="invalid-feedback">{formState.errors.certificateTemplateId?.message}</div>
                        </div>
                    </div>
                    {action == 'delete' && <p className="mb-0">Are you sure you want to {action} this course?</p>}
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


CourseEditModal.getModalProps = () => {
    return {
        contentClassName: 'h-100',
        size: 'lg',
    };
};

export default CourseEditModal;