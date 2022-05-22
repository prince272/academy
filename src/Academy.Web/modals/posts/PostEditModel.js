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
import DocumentEditor from '../../components/DocumentEditor';
import MediaUploader, { MediaExtensions } from '../../components/MediaUploader';
import { BsInfoCircle } from 'react-icons/bs';
import { useAppSettings } from '../../utils/appSettings';
import { useEventDispatcher } from '../../utils/eventDispatcher';
import _ from 'lodash';

const PostEditModal = withRemount((props) => {
    const { route, modal, remount, updateModalProps } = props;
    const router = useRouter();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [loading, setLoading] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [action, setAction] = useState(route.query.action);
    const postId = route.query.postId;

    const componentId = useMemo(() => _.uniqueId('Component'), []);
    const eventDispatcher = useEventDispatcher();
    const appSettings = useAppSettings();
    const client = useClient();

    const load = async () => {
        if (action == 'edit') {

            setLoading({});

            let result = await client.get(`/posts/${postId}`);

            if (result.error) {
                const error = result.error;

                setLoading({ ...error, message: 'Unable to load post.', fallback: modal.close, remount });
                return;
            }

            form.reset({
                ...result.data,
                published: !!result.data.published,
                imageId: result.data.image?.id
            });
            setLoading(null);
        }
        else {
            form.reset({});
            setLoading(null);
        }
    };

    const submit = () => {
        form.handleSubmit(async (inputs) => {

            setSubmitting(true);

            let result = await ({
                'add': () => client.post(`/posts`, inputs),
                'edit': () => client.put(`/posts/${postId}`, inputs),
                'delete': () => client.delete(`/posts/${postId}`)
            })[action]();

            if (result.error) {
                const error = result.error;
                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                toast.error(error.message, { id: componentId });
                setSubmitting(false);
                return;
            }

            if (action == 'add' || action == 'edit') {
                eventDispatcher.emit(`${action}Post`, (await client.get(`/posts/${result.data || postId}`, { throwIfError: true })).data.data);
            }
            else if (action == 'delete') {
                eventDispatcher.emit(`${action}Post`, { id: postId });
            }

            toast.success(`Post ${action == 'delete' ? (action + 'd') : (action + 'ed')}.`, { id: componentId });
            modal.close();
        })();
    };

    useEffect(() => {
        if (action == 'delete') {
            updateModalProps({ size: 'md', contentClassName: '' });
        }
        else {
            updateModalProps(PostEditModal.getModalProps());
        }

    }, [action]);

    useEffect(() => {
        load();
    }, []);


    if (loading) return (<Loader {...loading} />);

    return (
        <>
            <Modal.Header closeButton>
                <Modal.Title>{pascalCase(action)} post</Modal.Title>
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
                            <label className="form-label">Category</label>
                            <select {...form.register("category")} className={`form-select  ${formState.errors.category ? 'is-invalid' : ''}`}>
                                {appSettings.post.categories.map((item) => (
                                    <option key={item.value} value={item.value}>{item.name}</option>
                                ))}
                            </select>
                            <div className="invalid-feedback">{formState.errors.category?.message}</div>
                        </div>

                        {client.user.roles.some(role => role == 'admin') && (
                            <div className="col-12 col-sm-6">
                                <label className="form-label">State</label>
                                <select {...form.register("published")} className={`form-select  ${formState.errors.published ? 'is-invalid' : ''}`}>
                                    {[
                                        { value: false, name: 'Unpublished' },
                                        { value: true, name: 'Published' },
                                    ].map((item) => (
                                        <option key={item.value} value={item.value}>{item.name}</option>
                                    ))}
                                </select>
                                <div className="invalid-feedback">{formState.errors.published?.message}</div>
                            </div>
                        )}

                        <div className="col-12">
                            <label className="form-label">Description</label>
                            <FormController name="description" control={form.control}
                                render={({ field }) => {
                                    return (<DocumentEditor value={field.value} onChange={(value) => field.onChange(value)} />);
                                }} />
                            <div className="invalid-feedback">{formState.errors.description?.message}</div>
                        </div>

                        <div className="col-12">
                            <label className="form-label">Image</label>
                            <FormController name="imageId" control={form.control}
                                render={({ field }) => {
                                    return (<MediaUploader length={1} value={field.value} onChange={(value) => field.onChange(value)} extensions={MediaExtensions.IMAGE} />);
                                }} />
                            <div className="invalid-feedback">{formState.errors.imageId?.message}</div>
                        </div>
                    </div>
                    {action == 'delete' && <p className="mb-0">Are you sure you want to {action} this post?</p>}
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


PostEditModal.getModalProps = () => {
    return {
        contentClassName: 'h-100',
        size: 'lg',
    };
};

export default PostEditModal;