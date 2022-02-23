import { useEffect, useState } from 'react';
import { Modal, Tab, Nav, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useForm, Controller as FormController, useFieldArray } from 'react-hook-form';
import { BsArrowLeft, BsXLg, BsGripVertical, BsTrash } from 'react-icons/bs';
import { useClient } from '../../utils/client';
import { preventDefault, arrayMove } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import MediaUploader, { MediaExtensions } from '../../components/MediaUploader';
import { withRemount } from '../../utils/hooks';
import Loader from '../../components/Loader';
import Countdown from 'react-countdown';
import ReactPinField from 'react-pin-field';

const EditProfileTab = ({ }) => {

    const client = useClient();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState({});

    const load = () => {
        form.reset({
            ...client.user,
            avatarId: client.user.avatar?.id
        });
        setLoading(null);
    };

    const submit = () => {
        form.handleSubmit(async (inputs) => {

            setSubmitting(true);

            let result = await client.put(`/accounts/profile`, inputs);

            setSubmitting(false);

            if (result.error) {
                const error = result.error;

                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));

                toast.error(error.message);
                return;
            }

            toast.success(`Profile saved.`);
            await client.reloadUser();
        })();
    };

    useEffect(() => {
        load();
    }, []);

    return (
        <div>
            <form onSubmit={preventDefault(() => submit())}>
                <div className="row g-3">
                    <div className="col-12">
                        <label className="form-label">Profile picture</label>
                        <FormController name="avatarId" control={form.control}
                            render={({ field }) => {
                                return (<MediaUploader length={1} value={field.value} onChange={(value) => field.onChange(value)} extensions={MediaExtensions.IMAGE} layout="circle" />);
                            }} />
                        <div className="invalid-feedback">{formState.errors.avatarId?.message}</div>
                    </div>
                    <div className="col-6">
                        <label className="form-label">First name</label>

                        <input {...form.register("firstName")} className={`form-control  ${formState.errors.firstName ? 'is-invalid' : ''}`} />
                        <div className="invalid-feedback">{formState.errors.firstName?.message}</div>
                    </div>
                    <div className="col-6">
                        <label className="form-label">Last name</label>

                        <input {...form.register("lastName")} className={`form-control  ${formState.errors.lastName ? 'is-invalid' : ''}`} />
                        <div className="invalid-feedback">{formState.errors.lastName?.message}</div>
                    </div>
                    <div className="col-12">
                        <label className="form-label">Bio</label>

                        <textarea {...form.register("bio")} className={`form-control ${formState.errors.bio ? 'is-invalid' : ''}`} rows="5" />
                        <div className="invalid-feedback">{formState.errors.bio?.message}</div>
                    </div>
                    <div className="col-12">
                        <button className="btn  btn-primary px-5 w-100 w-sm-auto" type="button" disabled={submitting} onClick={() => submit()}>
                            <div className="position-relative d-flex align-items-center justify-content-center">
                                <div className={`${submitting ? 'invisible' : ''}`}>Save</div>
                                {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                            </div>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

const ChangeAccountTab = ({ }) => {

    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [sending, setSending] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const client = useClient();

    const [codeSent, setCodeSent] = useState(0);
    const [codeSentDate, setCodeSentDate] = useState(null);

    useEffect(() => {
        form.setValue('username', '');
    }, []);

    const sendCode = () => {
        form.handleSubmit(async (inputs) => {
            const toastId = toast.loading('Sending code...');

            setSending(true);
            let result = await client.post('/accounts/change/send', inputs);
            setSending(false);

            if (result.error) {
                const error = result.error;

                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));

                toast.error('Unable to send code.', { id: toastId });
            }
            else {
                setCodeSent(codeSent + 1);
                toast.success('Code sent.', { id: toastId });
            }
        })();
    };

    const submit = () => {

        if (!codeSent) {
            sendCode();
            return;
        }

        form.handleSubmit(async (inputs) => {

            setSubmitting(true);
            let result = await client.post('/accounts/change', inputs);
            setSubmitting(false);

            if (result.error) {
                const error = result.error;

                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));

                toast.error(error.message);

                return;
            }

            form.reset();
            toast.success('Account changed.');
        })();
    };

    useEffect(() => { if (codeSent == 1) setCodeSentDate(Date.now()); }, [codeSent]);

    return (
        <div>
            <form onSubmit={preventDefault(() => submit())}>
                <div className="row g-3">
                    <div className="col-12">
                        <label className="form-label">New email or phone number</label>

                        <input {...form.register("username")} className={`form-control  ${formState.errors.username ? 'is-invalid' : ''}`} />
                        <div className="invalid-feedback">{formState.errors.username?.message}</div>
                    </div>
                    {!!codeSentDate && (
                        <div className="col-12">
                            <div className="d-flex justify-content-between align-items-center">
                                <label className="form-label">Code</label>
                                <Countdown date={codeSentDate + 60000} autoStart={true} renderer={({ seconds, minutes, completed, api }) => {
                                    if (completed) {
                                        return (
                                            <span className="form-label">Didn&apos;t receive code? <a className="form-label-link" href="#" onClick={preventDefault(() => {
                                                api.stop();
                                                api.start();

                                                sendCode();
                                            })}>Send code</a></span>
                                        );
                                    } else {

                                        if (!codeSent) {
                                            return (
                                                <span className="form-label"><a className="form-label-link" href="#" onClick={preventDefault(() => {
                                                    api.stop();
                                                    api.start();

                                                    sendCode();
                                                })}>Send code</a></span>
                                            );
                                        }
                                        else {
                                            return (<span className="form-label">Sending in {minutes + ":" + (seconds < 10 ? '0' : '') + seconds}</span>);
                                        }
                                    }
                                }} />
                            </div>

                            <FormController name="code" control={form.control}
                                render={({ field }) => {
                                    return (<div className="hstack gap-1 "><ReactPinField className="form-control  text-center mx-1" onChange={(value, index) => field.onChange(value)} length={6} disabled={!codeSent} /></div>);
                                }}
                            />
                            <div className="invalid-feedback">{formState.errors.code?.message}</div>
                        </div>
                    )}
                    <div className="col-12">
                        <button className="btn  btn-primary px-5 w-100 w-sm-auto" type="submit" disabled={(codeSent ? submitting : sending)}>
                            <div className="position-relative d-flex align-items-center justify-content-center">
                                <div className={`${(codeSent ? submitting : sending) ? 'invisible' : ''}`}>{codeSent ? 'Change account' : 'Send code'}</div>
                                {(codeSent ? submitting : sending) && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                            </div>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

const ChangePasswordTab = ({ }) => {

    const client = useClient();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState({});

    const load = () => {
        form.reset(client.user);
        setLoading(null);
    };

    const submit = () => {
        form.handleSubmit(async (inputs) => {

            setSubmitting(true);

            let result = await client.post(`/accounts/password/change`, inputs);

            setSubmitting(false);

            if (result.error) {
                const error = result.error;


                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));

                toast.error(error.message);
                return;
            }

            form.reset();
            toast.success(`Password changed.`);
        })();
    };

    useEffect(() => {
        load();
    }, []);

    return (
        <div>
            <form onSubmit={preventDefault(() => submit())}>
                <div className="row g-3">
                    <div className="col-12">
                        <label className="form-label">Current password</label>
                        <input {...form.register("currentPassword")} type={'password'} className={`form-control  ${formState.errors.currentPassword ? 'is-invalid' : ''}`} />
                        <div className="invalid-feedback">{formState.errors.currentPassword?.message}</div>
                    </div>
                    <div className="col-12">
                        <label className="form-label">New password</label>

                        <input {...form.register("newPassword")} type={'password'} className={`form-control  ${formState.errors.newPassword ? 'is-invalid' : ''}`} />
                        <div className="invalid-feedback">{formState.errors.newPassword?.message}</div>
                    </div>
                    <div className="col-12">
                        <button className="btn  btn-primary px-5 w-100 w-sm-auto" type="button" disabled={submitting} onClick={() => submit()}>
                            <div className="position-relative d-flex align-items-center justify-content-center">
                                <div className={`${submitting ? 'invisible' : ''}`}>Change password</div>
                                {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                            </div>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

const SettingsModal = ({ modal, updateModalProps }) => {
    const client = useClient();

    const tabs = (() => {
        const tabs = [];
        tabs.push({
            title: 'Edit profile',
            key: 'editProfile',
            Component: EditProfileTab,
        });

        tabs.push({
            title: 'Change email or phone',
            key: 'changeAccount',
            Component: ChangeAccountTab,
        });

        tabs.push({
            title: 'Change password',
            key: 'changePassword',
            Component: ChangePasswordTab,
        });

        return tabs;
    })();

    const [currentTab, setCurrentTab] = useState(null);

    useEffect(() => {
        updateModalProps({
            size: currentTab ? 'md' : 'sm',
            contentClassName: currentTab ? 'h-100' : '',
        });
    }, [currentTab]);

    return (
        <>
            <Modal.Body className="p-0">
                <Tab.Container unmountOnExit={true} activeKey={currentTab?.key || null} onSelect={(tabKey) => setCurrentTab(tabs.find(tab => tab.key == tabKey))}>
                    <div className="row g-0 h-100">
                        <div className={`${currentTab ? 'col-lg-4' : 'col-12'} border-end ${currentTab ? 'd-none' : ''}`}>
                            <div>
                                <div className="d-flex align-items-center justify-content-between p-3">
                                    <div className="h4 text-center mb-0">Settings</div>

                                    {!currentTab && (
                                        <a className="btn btn-outline-secondary btn-sm btn-icon btn-no-focus border-0" onClick={() => modal.close()}>
                                            <span className="svg-icon svg-icon-xs d-inline-block" ><BsXLg /></span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            <Nav variant="pills" className="flex-column mb-2 px-2">
                                {tabs.map((tab) => {
                                    return (
                                        <Nav.Item key={tab.key} className="cursor-default">
                                            <Nav.Link eventKey={tab.key}><span>{tab.title}</span></Nav.Link>
                                        </Nav.Item>
                                    );
                                })}
                            </Nav>
                        </div>
                        <div className="col-12">
                            <div className="d-flex flex-column h-100">
                                {currentTab && (
                                    <div>
                                        <div className="d-flex align-items-center justify-content-between p-3">
                                            <OverlayTrigger placement="bottom" overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Back</Tooltip>}>
                                                <a className="btn btn-outline-secondary btn-sm btn-icon btn-no-focus border-0" onClick={() => setCurrentTab(null)}>
                                                    <span className="svg-icon svg-icon-sm d-inline-block" ><BsArrowLeft /></span>
                                                </a>
                                            </OverlayTrigger>

                                            <div className="mb-0 mx-auto">
                                                <div className="h4 text-center mb-0">{currentTab.title}</div>
                                                <div className="pt-1 small">
                                                </div>
                                            </div>

                                            <a className="btn btn-outline-secondary btn-sm btn-icon btn-no-focus border-0" onClick={() => modal.close()}>
                                                <span className="svg-icon svg-icon-xs d-inline-block" ><BsXLg /></span>
                                            </a>
                                        </div>
                                    </div>
                                )}
                                <div className="flex-grow-1 h-100 position-relative">
                                    <Tab.Content className="px-4 position-absolute w-100 h-100 overflow-auto h-100">
                                        {tabs.map((tab) => {
                                            return (
                                                <Tab.Pane key={tab.key} eventKey={tab.key} className="h-100">
                                                    <tab.Component />
                                                </Tab.Pane>
                                            );
                                        })}

                                    </Tab.Content>
                                </div>
                            </div>
                        </div>
                    </div>
                </Tab.Container>
            </Modal.Body>
        </>
    );
};

SettingsModal.getModalProps = () => {
    return {
        contentClassName: '',
        size: 'sm'
    };
};

export default SettingsModal;