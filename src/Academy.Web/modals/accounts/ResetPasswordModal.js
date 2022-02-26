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
import { ModalPathPrefix } from '../../modals';
import PhoneInput from '../../components/PhoneInput';
import { useAppSettings } from '../../utils/appSettings';

const ResetPasswordModal = (props) => {
    const { route } = props;
    const router = useRouter();

    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [sending, setSending] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const client = useClient();

    const [codeSent, setCodeSent] = useState(0);
    const [codeSentDate, setCodeSentDate] = useState(null);

    const appSettings = useAppSettings();

    const sendCode = () => {
        form.handleSubmit(async (inputs) => {
            const toastId = toast.loading('Sending code...');

            setSending(true);
            let result = await client.post('/accounts/password/reset/send', inputs);
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
            let result = await client.post('/accounts/password/reset', inputs);

            if (result.error) {
                const error = result.error;
                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                toast.error(error.message);
                setSubmitting(false);
                return;
            }

            router.replace({
                pathname: `${ModalPathPrefix}/accounts/signin`, query: cleanObject({
                    returnUrl: route.query.returnUrl,
                    provider: 'username',
                    inputs: JSON.stringify({ username: inputs.username, password: inputs.password })
                })
            });
        })();
    };

    useEffect(() => { if (codeSent == 1) setCodeSentDate(Date.now()); }, [codeSent]);

    return (
        <>
            <Modal.Header bsPrefix="modal-close" closeButton></Modal.Header>
            <Modal.Body as={Form} onSubmit={preventDefault(() => submit())}>
                <div className="text-center mb-5">
                    <h4>{!codeSent ? 'Reset password' : 'Enter security code'}</h4>
                    <p>{!codeSent ? 'We\'ll send you a security code.' : 'We\'ve sent a security code.'}</p>
                </div>
                <div className="row g-3">
                    <div className="col-12">
                        <label className="form-label">Email or phone number</label>
                        <FormController name="username" control={form.control} render={({ field }) => {
                            return (<PhoneInput disabled={codeSent} value={field.value} onChange={(value) => field.onChange(value)} className={`form-control  ${formState.errors.username ? 'is-invalid' : ''}`} defaultCountry={appSettings.company.countryCode} />);
                        }} />
                        <div className="invalid-feedback">{formState.errors.username?.message}</div>
                    </div>
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center">
                            <label className="form-label">New password</label>
                        </div>
                        <input {...form.register("password")} type="password" disabled={codeSent} autoComplete={'true'} className={`form-control  ${formState.errors.password ? 'is-invalid' : ''}`} />
                        <div className="invalid-feedback">{formState.errors.password?.message}</div>
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
                    <div className="col-12 mt-5">
                        <button className="btn btn-primary  w-100" type="submit" disabled={(codeSent ? submitting : sending)}>
                            <div className="position-relative d-flex align-items-center justify-content-center">
                                <div className={`${(codeSent ? submitting : sending) ? 'invisible' : ''}`}>{codeSent ? 'Reset password' : 'Send code'}</div>
                                {(codeSent ? submitting : sending) && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                            </div>
                        </button>
                    </div>
                </div>
            </Modal.Body>
        </>
    );
};

export default ResetPasswordModal;