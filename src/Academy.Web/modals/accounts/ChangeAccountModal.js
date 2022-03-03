import { useState, useCallback, useEffect, useMemo, useImperativeHandle } from 'react';
import Link from 'next/link';
import { Form, Modal } from 'react-bootstrap';
import { useForm, Controller as FormController } from 'react-hook-form';
import toast from 'react-hot-toast';
import ReactPinField from 'react-pin-field';
import { useRouter } from 'next/router';
import { cleanObject, preventDefault } from '../../utils/helpers';
import Countdown from 'react-countdown';
import { useClient } from '../../utils/client';
import { ModalPathPrefix } from '..';
import PhoneInput from '../../components/PhoneInput';
import { useAppSettings } from '../../utils/appSettings';
import MediaUploader, { MediaExtensions } from '../../components/MediaUploader';
import { noCase, sentenceCase } from 'change-case';

const ChangeAccountModal = (props) => {

    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [sending, setSending] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const client = useClient();

    const [codeSent, setCodeSent] = useState(0);
    const [codeSentDate, setCodeSentDate] = useState(null);
    const appSettings = useAppSettings();

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

            if (result.error) {
                const error = result.error;
                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                toast.error(error.message);
                setSubmitting(false);
                return;
            }

            form.reset();
            toast.success(`email or phone number changed.`);
            setSubmitting(false);
        })();
    };

    useEffect(() => { if (codeSent == 1) setCodeSentDate(Date.now()); }, [codeSent]);

    return (
        <>
            <Modal.Header bsPrefix="modal-close" closeButton></Modal.Header>
            <Modal.Body as={Form} onSubmit={preventDefault(() => submit())}>
                <div className="text-center mb-5">
                    <h4>Change email or phone</h4>
                </div>
                <div className="row g-3">
                    {client.user.email && (
                        <div className="col-12">
                            <label className="form-label">Current email</label>
                            <input className={`form-control`} value={client.user.email} disabled={true} />
                        </div>
                    )}
                    {client.user.phoneNumber && (
                        <div className="col-12">
                            <label className="form-label">Current phone number</label>
                            <PhoneInput value={lient.user.phoneNumber} disabled={true} />
                        </div>
                    )}
                    <div className="col-12">
                        <label className="form-label">New email or phone number</label>
                        <FormController name="username" control={form.control} render={({ field }) => {
                            return (<PhoneInput value={field.value} onChange={(value) => field.onChange(value)} className={`form-control  ${formState.errors.username ? 'is-invalid' : ''}`} defaultCountry={appSettings.company.countryCode} />);
                        }} />
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
                </div>
            </Modal.Body>
            <Modal.Footer>
                <div className="d-flex gap-3 justify-content-end w-100">
                    <button className="btn btn-primary px-5 w-100 w-sm-auto" type="button" onClick={() => submit()} disabled={(codeSent ? submitting : sending)}>
                        <div className="position-relative d-flex align-items-center justify-content-center">
                            <div className={`${(codeSent ? submitting : sending) ? 'invisible' : ''}`}>{codeSent ? 'Change account' : 'Send code'}</div>
                            {(codeSent ? submitting : sending) && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                        </div>
                    </button>
                </div>
            </Modal.Footer>
        </>
    );
};

export default ChangeAccountModal;