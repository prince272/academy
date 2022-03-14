import React, { useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef, useContext, useMemo } from 'react';
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
import LinesEllipsis from 'react-lines-ellipsis';
import responsiveHOC from 'react-lines-ellipsis/lib/responsiveHOC';
const ResponsiveEllipsis = responsiveHOC()(LinesEllipsis);

import { useDialog } from '../../utils/dialog';
import _ from 'lodash';

const WithdrawModal = withRemount((props) => {
    const { route, modal, remount } = props;
    const router = useRouter();
    const form = useForm({ shouldUnregister: true });
    const formState = form.formState;
    const [loading, setLoading] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const componentId = useMemo(() => _.uniqueId('Component'), []);
    const appSettings = useAppSettings();

    const dialog = useDialog();
    const client = useClient();

    const load = async () => {
        form.setValue('mode', 'mobile');
        setLoading(null);
    };

    const submit = () => {

        form.handleSubmit(async (inputs) => {

            const accountNumber = form.watch('mobileNumber');
            const confirmed = await dialog.confirm({
                title: `Send to ${accountNumber}`,
                body: <><span></span>You are about to send an amount of <span className="fw-bold">{appSettings.currency.symbol}{form.watch('amount')}</span> to <span className="fw-bold">{accountNumber}</span>. Please note that this operation cannot reversed.</>
            });

            if (!confirmed) {
                return;
            }

            setSubmitting(true);

            const paymentMode = form.watch('mode');
            let result = await client.post(`/accounts/withdraw`, { ...inputs, mode: paymentMode }, { params: { returnUrl: route.url } });

            if (result.error) {
                const error = result.error;
                Object.entries(error.details).forEach(([name, message]) => form.setError(name, { type: 'server', message }));
                toast.error(error.message, { id: componentId });
                setSubmitting(false);
                return;
            }

            await client.reloadUser();
            toast.success(`Payment successful.`, { id: componentId });
            modal.close();
        })();
    };

    useEffect(load, []);

    if (loading) return (<Loader {...loading} />);

    return (
        <>
            <Modal.Header bsPrefix="modal-close" closeButton></Modal.Header>
            <Modal.Body className="p-0" as={Form} onSubmit={preventDefault(() => submit())}>
                <div className="text-center p-4">
                    <div className="h5">Your balance</div>
                    <div className="h2 text-primary"><span>{appSettings.currency.symbol}</span> <span>{client.user.balance}</span></div>
                </div>
                <div>
                    <div className="list-group list-group-flush">
                        <div className="list-group-item p-0">
                            <div className="px-4">
                                <div className="form-check mb-0 py-3" onClick={() => form.setValue('mode', 'mobile')}>
                                    <input type="radio" className="form-check-input" name="formRadio" checked={form.watch('mode') == 'mobile'} />
                                    <label className="form-check-label">Send to <span className="fw-bold">Mobile Money</span></label>
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
                                                <label className="form-label">Amount</label>
                                                <div className="input-group input-group-merge">
                                                    <div className="input-group-prepend input-group-text">{appSettings.currency.symbol}</div>
                                                    <FormController name="amount" control={form.control}
                                                        render={({ field }) => {
                                                            return (
                                                                <Cleave value={field.value}
                                                                    options={{ numeral: true, numeralThousandsGroupStyle: "thousand" }}
                                                                    onChange={(value) => field.onChange(value)} className={`form-control  ${formState.errors.amount ? 'is-invalid' : ''}`} />
                                                            );
                                                        }} />
                                                </div>
                                                <div className="invalid-feedback">{formState.errors.amount?.message}</div>
                                            </div>
                                            <div className="col-12">
                                                <button className="btn btn-primary w-100" type="button" onClick={() => submit()} disabled={submitting}>
                                                    <div className="position-relative d-flex align-items-center justify-content-center">
                                                        <div className={`${submitting ? 'invisible' : ''}`}>Send <span className="mb-0"><span>{appSettings.currency.symbol}{form.watch('amount')}</span></span></div>
                                                        {submitting && <div className="position-absolute top-50 start-50 translate-middle"><div className="spinner-border spinner-border-sm"></div></div>}
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Collapse>
                        </div>
                    </div>
                </div>
            </Modal.Body>
        </>
    );
});

WithdrawModal.getModalProps = () => {
    return {
        size: 'sm'
    };
};

export default WithdrawModal;