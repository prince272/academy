import { useClient } from '../utils/client';
import { withRemount } from '../utils/hooks';
import Loader from '../components/Loader';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { preventDefault } from '../utils/helpers';
import toast from 'react-hot-toast';
import { OverlayTrigger, Dropdown, Tooltip } from 'react-bootstrap';
import { BsPersonFill, BsThreeDots } from 'react-icons/bs';
import TextareaAutosize from 'react-textarea-autosize';
import Image from 'next/image';
import { pascalCase } from 'change-case';

const CommentItem = (props) => {

    const { comment } = props;
    const [action, setAction] = useState(props.action);
    const client = useClient();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [submitting, setSubmitting] = useState(false);

    const load = () => {
        form.reset(comment);
    };

    const submit = () => {
        form.handleSubmit(async (inputs) => {

            setSubmitting(true);

            let result = await ({
                'add': () => client.post(`/comments`, inputs),
                'edit': () => client.put(`/comments/${comment.id}`, inputs),
                'delete': () => client.delete(`/comments/${comment.id}`)
            })[action]();

            setSubmitting(false);

            if (result.error) {
                const error = result.error;

                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));

                toast.error(error.message);
                return;
            }

            toast.success(`Comment ${action == 'delete' ? (action + 'd') : (action + 'ed')}.`);
        })();
    };

    useEffect(() => {
        load();
    }, [])

    return (
        <div className="hstack gap-2 align-items-start">
            <div className=" flex-grow-1">
                <div className="card mb-2">
                    <div className="card-header border-bottom px-2 py-1">
                        <div className="d-flex justify-content-between align-items-center" style={{ height: "31px" }}>
                            <div className="d-flex align-items-center">
                                <div className="d-flex align-items-center justify-content-center me-1">

                                    {client.user.avatarUrl ?
                                        (<Image className="rounded-pill" priority unoptimized loader={({ src }) => src} src={client.user.avatarUrl} width={20} height={20} objectFit="cover" alt={`${client.user.firstName} ${client.user.lastName}`} />) :
                                        (
                                            <div className="rounded-pill d-flex align-items-center justify-content-center bg-light text-dark" style={{ width: "20px", height: "20px" }}>
                                                <div className="svg-icon svg-icon-xs d-inline-block" ><BsPersonFill /></div>
                                            </div>
                                        )}

                                </div>
                                <div className="small"><span className="fw-bold">{client.user.firstName}</span> commented on Sep 7, 2020</div>
                            </div>
                            <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Options</Tooltip>}>
                                {({ ...triggerHandler }) => (
                                    <Dropdown>
                                        <Dropdown.Toggle {...triggerHandler} variant="outline-secondary" bsPrefix=" " className="btn-icon btn-no-focus rounded-pill border-0" style={{ width: "1.9125rem", height: "1.9125rem" }}>
                                            <span className="svg-icon svg-icon-xs d-inline-block" ><BsThreeDots /></span>
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu style={{ margin: 0 }}>
                                            <Dropdown.Item onClick={() => setAction('edit')}>Edit</Dropdown.Item>
                                            <Dropdown.Item onClick={() => setAction('delete')}>Delete</Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                )}
                            </OverlayTrigger>
                        </div>
                    </div>
                    <form className="card-body py-2 px-2 vstack gap-1" onSubmit={preventDefault(() => submit())}>
                        <input {...form.register("entityId")} style={{ display: "none" }} />
                        <input {...form.register("entityName")} style={{ display: "none" }} />


                        <div className="px-1">
                            {action != 'view' && <TextareaAutosize {...form.register("text")} className={`form-control textarea-noresize border-0 shadow-none bg-transparent p-0 ${formState.errors.text ? 'is-invalid' : ''}`} placeholder="Write your comment..." style={{ resize: "none" }}  />}
                            {action == 'view' && <div className="text-break">{comment.text}</div>}
                        </div>

                        <div className="invalid-feedback">{formState.errors.text?.message}</div>
                        <div className="ms-2 d-flex justify-content-end">
                            {action != 'add' && (
                                <div className="d-flex justify-content-end">
                                    <div className="hstack gap-2">
                                        {action != 'view' ? (
                                            <>
                                                <a className="py-1 btn btn-sm btn-secondary" href="#" onClick={preventDefault(() => setAction('view'))}>Cancel</a>
                                                <a className={`py-1 btn btn-sm btn-${action == 'delete' ? 'danger' : 'primary'}`} href="#" onClick={preventDefault(() => setAction('edit'))}>{action == 'delete' ? 'Delete' : 'Save'}</a>
                                            </>
                                        ) : (
                                            <>

                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                            {action == 'add' && (<button type="button" className="btn btn-sm btn-primary py-1" disabled={submitting} onClick={preventDefault(() => { submit(); })}>Add</button>)}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

const CommentList = withRemount((props) => {
    const { entityName, entityId, parentId, user, remount } = props;
    const client = useClient();
    const [loading, setLoading] = useState({});
    const [page, setPage] = useState(null);

    const load = async () => {
        let result = await client.get(`/comments`, { params: { entityName, entityId, parentId } });

        if (result.error) {
            const error = result.error;
            setLoading({ ...error, message: 'Unable to load comments.', remount });
            return;
        }

        setPage(result.data);
        setLoading(null);
    };

    useEffect(() => {
        load();
    }, []);

    if (loading) return (<Loader {...loading} />);

    return (
        <div className="vstack gap-3">
            <CommentItem action={'add'} comment={{
                user: client.user,
                entityName,
                entityId,
            }} />
            {page.items.map((comment) => {
                return (<CommentItem key={comment.id} action={'view'} comment={comment} />);
            })}
        </div>
    );
});

export { CommentList };