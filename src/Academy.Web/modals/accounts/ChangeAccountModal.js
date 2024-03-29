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
import { noCase, pascalCase, sentenceCase } from 'change-case';
import _ from 'lodash';

const createModal = (accountType) => {
    return (props) => {
        const { modal } = props;

        const form = useForm({ shouldUnregister: true });
        const formState = form.formState;
        const [sending, setSending] = useState(false);
        const [submitting, setSubmitting] = useState(false);
        const client = useClient();

        const accountAction = ({
            'email': () => client.user.email ? 'change' : 'set',
            'phoneNumber': () => client.user.phoneNumber ? 'change' : 'set',
        })[accountType]();

        const accountInfo = ({
            'email': () => client.user.email,
            'phoneNumber': () => client.user.phoneNumber,
        })[accountType]();

        const [codeSent, setCodeSent] = useState(0);
        const [codeSentDate, setCodeSentDate] = useState(null);

        const componentId = useMemo(() => _.uniqueId('Component'), []);
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
                    toast.error(error.message, { id: componentId });
                    setSubmitting(false);
                    return;
                }

                toast.success(`Your ${noCase(accountType)} has been ${accountAction == 'change' ? (accountAction + 'd') : (accountAction)}.`, { id: componentId });
                modal.close();
            })();
        };

        useEffect(() => { if (codeSent == 1) setCodeSentDate(Date.now()); }, [codeSent]);

        return (
            <>
                <Modal.Header bsPrefix="modal-close" closeButton></Modal.Header>
                <Modal.Body as={Form} onSubmit={preventDefault(() => submit())}>
                    <div className="text-center mb-5">
                        <h4>{pascalCase(accountAction)} {noCase(accountType)}</h4>
                    </div>
                    <div className="row g-3">
                        {accountInfo && (
                            <div className="col-12">
                                <label className="form-label">Current {noCase(accountType)}</label>
                                <PhoneInput className={`form-control`} value={accountInfo} disabled={true} />
                            </div>
                        )}
                        <div className="col-12">
                            <label className="form-label">New {noCase(accountType)}</label>
                            <FormController name="username" control={form.control} render={({ field }) => {
                                return (<PhoneInput value={field.value} disabled={codeSent} onChange={(value) => field.onChange(value)} className={`form-control  ${formState.errors.username ? 'is-invalid' : ''}`} defaultCountry={appSettings.company.countryCode} />);
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
                                <div className={`${(codeSent ? submitting : sending) ? 'invisible' : ''}`}>{codeSent ? `${pascalCase(accountAction)} ${noCase(accountType)}` : 'Send code'}</div>
                                {(codeSent ? submitting : sending) && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                            </div>
                        </button>
                    </div>
                </Modal.Footer>
            </>
        );
    };
};

const ChangeEmailModal = createModal('email');
const ChangePhoneNumberModal = createModal('phoneNumber');

export { ChangeEmailModal, ChangePhoneNumberModal };