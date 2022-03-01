import React, { useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef, useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Form, Modal, Accordion, useAccordionButton, AccordionContext, Collapse } from 'react-bootstrap';
import { useForm, Controller as FormController } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { cleanObject, preventDefault, sleep } from '../../utils/helpers';
import { useClient } from '../../utils/client';
import { noCase } from 'change-case';
import PhoneInput from '../../components/PhoneInput';
import { useAppSettings } from '../../utils/appSettings';
import Cleave from 'cleave.js/react';
import { AspectRatio } from 'react-aspect-ratio';
import Loader from '../../components/Loader';
import { withAsync, withRemount } from '../../utils/hooks';
import { BsCheckCircleFill, BsClockHistory, BsXCircleFill } from 'react-icons/bs';
import { ModalPathPrefix } from '..';
import TruncateMarkup from 'react-truncate-markup';

function lowerCaseFirst(input) {
    return input.charAt(0).toLowerCase() + input.substr(1);
}

const PaymentDebitModal = withRemount((props) => {
    const { route, modal, remount } = props;
    const router = useRouter();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [loading, setLoading] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const appSettings = useAppSettings();
    const paymentId = route.query.paymentId;
    let [payment, setPayment] = withAsync(useState(null));

    if (!route.query.returnUrl) throw new Error(`The query parameter 'returnUrl' was not found. url: ${route.url}`);

    const client = useClient();

    const load = async () => {
        setLoading({});

        form.setValue('mode', 'mobile');

        let result = await client.get(`/payments/${paymentId}`);

        if (result.error) {
            const error = result.error;

            setLoading({ ...error, message: 'Unable to load payment.', fallback: modal.close, remount });
            return;
        }

        payment = await setPayment(result.data);

        if (payment.status == 'processing') {
            checkPayment();
        }

        setLoading(null);
    };

    const submit = () => {

        form.handleSubmit(async (inputs) => {
            setSubmitting(true);

            const paymentMode = form.watch('mode');

            let result = await ({
                'mobile': () => client.post(`/payments/${paymentId}/mobile/process`, inputs, { params: { returnUrl: route.url } }),
                'checkout': () => client.post(`/payments/${paymentId}/checkout`, null, { params: { returnUrl: route.url } }),
            })[paymentMode]();

            if (result.error) {
                const error = result.error;
                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                toast.error(error.message);
                setSubmitting(false);
                return;
            }

            payment = await setPayment({ ...payment, status: 'processing' });
            checkPayment();

            if (paymentMode == 'checkout') {
                window.location.assign(result.data.checkoutUrl);
            }
        })();
    };

    const checkPayment = async () => {
        for (let count = 0; count < 5; count++) {
            const result = await client.get(`/payments/${paymentId}`);

            if (!result.error) {
                payment = await setPayment(result.data);
                if (payment.status != 'processing') break;
            }

            await sleep(5000);
        }

        if (payment.status == 'processing')
            payment = await setPayment({ ...payment, status: 'timeout' });
    };

    useEffect(load, []);

    if (loading) return (<Loader {...loading} />);

    return (
        <>
            <Modal.Header bsPrefix="modal-close" closeButton></Modal.Header>
            <Modal.Body className="p-0" as={Form} onSubmit={preventDefault(() => submit())}>
                <div className="mt-3 px-4">
                    <TruncateMarkup lines={2}><h4>{payment.status == 'pending' ? payment.title : <>Payment {noCase(payment.status)}</>}</h4></TruncateMarkup>
                </div>
                {payment.status == 'pending' && (
                    <div>
                        <div className="list-group list-group-flush">
                            <div className="list-group-item p-0">
                                <div className="px-4">
                                    <div className="form-check mb-0 py-3" onClick={() => form.setValue('mode', 'mobile')}>
                                        <input type="radio" className="form-check-input" name="formRadio" checked={form.watch('mode') == 'mobile'} />
                                        <label className="form-check-label">Pay with <span className="fw-bold">Mobile Money</span></label>
                                    </div>
                                </div>
                                <Collapse in={form.watch('mode') == 'mobile'}>
                                    <div>
                                        <div className="px-4 py-3">
                                            <div className="row g-3">
                                                <div className="col-12">
                                                    <label className="form-label">Mobile number</label>
                                                    <FormController name="mobileNumber" control={form.control} render={({ field }) => {
                                                        return (<PhoneInput value={field.value} onChange={(value) => field.onChange(value)} className={`form-control  ${formState.errors.mobileNumber ? 'is-invalid' : ''}`} defaultCountry={appSettings.company.countryCode} />);
                                                    }} />
                                                    <div className="invalid-feedback">{formState.errors.mobileNumber?.message}</div>
                                                </div>
                                                <div className="col-12">

                                                    <button className="btn btn-primary w-100" type="button" onClick={() => submit()} disabled={submitting}>
                                                        <div className="position-relative d-flex align-items-center justify-content-center">
                                                            <div className={`${submitting ? 'invisible' : ''}`}>Pay <span className="mb-0"><span>{appSettings.currency.symbol}{payment.amount}</span></span></div>
                                                            {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Collapse>
                            </div>
                            <div className="list-group-item p-0">
                                <div className="px-4">
                                    <div className="form-check mb-0 py-3" onClick={() => form.setValue('mode', 'checkout')}>
                                        <input type="radio" className="form-check-input" name="formRadio" checked={form.watch('mode') == 'checkout'} />
                                        <label className="form-check-label">Pay with <span className="fw-bold">PaySwitch</span></label>
                                    </div>
                                </div>
                                <Collapse in={form.watch('mode') == 'checkout'}>
                                    <div>
                                        <div className="px-4 py-3">
                                            <button className="btn btn-primary w-100" type="button" onClick={() => submit()} disabled={submitting}>
                                                <div className="position-relative d-flex align-items-center justify-content-center">
                                                    <div className={`${submitting ? 'invisible' : ''}`}>Pay <span className="mb-0"><span>{appSettings.currency.symbol}{payment.amount}</span></span></div>
                                                    {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </Collapse>
                            </div>
                        </div>
                    </div>
                )}
                {payment.status == 'processing' && (
                    <div>
                        <Loader message={({
                            'mobile': <span><span className="fw-bold">Heads-up!</span> We're waiting for approval from your phone to complete this payment. Please check your approvals list on your phone and approve this payment.</span>,
                            'checkout': <span>You will be redirected to third party payment provider to continue the payment process. If not, retry the payment again!</span>
                        })[form.watch('mode')]} />
                    </div>
                )}
                {payment.status == 'failed' && (
                    <div>
                        <div className="d-flex flex-column text-center justify-content-center p-4">
                            <div className="mb-3 px-10"><span className="svg-icon svg-icon-lg text-danger"><BsXCircleFill /></span></div>
                            <div className="h3">Payment failed</div>
                            <div className="mb-3">Something went wrong while processing your payment.</div>
                            <Link href={route.query.returnUrl}><a className="btn btn-danger">Return</a></Link>
                        </div>
                    </div>
                )}
                {payment.status == 'complete' && (
                    <div>
                        <div className="d-flex flex-column text-center justify-content-center p-4">
                            <div className="mb-3 px-10"><span className="svg-icon svg-icon-lg text-success"><BsCheckCircleFill /></span></div>
                            <div className="h3">Payment Complete</div>
                            <div className="mb-3">Thank you for your payment.</div>
                            <Link href={route.query.returnUrl}><a className="btn btn-success">Continue</a></Link>
                        </div>
                    </div>
                )}
                {payment.status == 'timeout' && (
                    <div>
                        <div className="d-flex flex-column text-center justify-content-center p-4">
                            <div className="mb-3 px-10"><span className="svg-icon svg-icon-lg text-info"><BsClockHistory /></span></div>
                            <div className="h3">Payment Timeout</div>
                            <div className="mb-3">Well, It looks like we've waited long enough. Please tap the check button after you have approved this payment from your phone.</div>

                            <div className="vstack gap-3">
                                <button type="button" className="btn btn-primary" onClick={async () => {
                                    payment = await setPayment({ ...payment, status: 'processing' });
                                    checkPayment();
                                }}>Check</button>
                                <Link href={route.query.returnUrl}><a className="btn btn-secondary">Cancel</a></Link>
                            </div>
                        </div>
                    </div>
                )}
            </Modal.Body>
            {(payment.status == 'pending' || payment.status == 'processing') &&
                (
                    <Modal.Footer className="d-block text-center py-sm-5">
                        <small className="text-cap mb-4">We accept all payments through</small>

                        <div className="w-85 mx-auto">
                            <AspectRatio ratio="512/52">
                                <Image src="/img/img3.png" layout="fill" className="image" />
                            </AspectRatio>
                        </div>
                    </Modal.Footer>
                )
            }
        </>
    );
});

PaymentDebitModal.getModalProps = () => {
    return {
        size: 'sm'
    };
};

export default PaymentDebitModal;