import Link from 'next/link';
import { AspectRatio } from 'react-aspect-ratio';
import { BsArrowRight, BsEnvelope, BsGeoAlt, BsPhone } from 'react-icons/bs';
import { SvgConversationIllus } from '../resources/images/illustrations';
import { useAppSettings } from '../utils/appSettings';
import { ModalPathPrefix } from '../modals';
import parsePhoneNumber from 'libphonenumber-js';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { SvgFacebookLogo, SvgInstagramLogo, SvgLinkedinLogo, SvgTwitterLogo, SvgYoutubeLogo } from '../resources/images/icons';

const Contact = () => {

    const appSettings = useAppSettings();

    return (
        <>
            <div className="bg-primary">
                <div className="container py-10 d-flex justify-content-center text-center">
                    <div className="zi-1">
                        <h1 className="text-white">Contact Us</h1>
                        <p className="text-white">Got a question? Want to learn more? Get in touch.</p>
                        <Link href={{ pathname: `${ModalPathPrefix}/contact`, query: { subject: "getInTouch" } }}><a className="btn btn-white  px-8 mb-3">Get in touch</a></Link>
                    </div>
                </div>
            </div>
            <div className="bg-white">
                <div className="container py-7">
                    <div className="row align-items-center text-center">
                        <div className="col-md-5">
                            <div className="px-10 px-md-0 py-3"><SvgConversationIllus /></div>
                        </div>
                        <div className="col-md-7 order-1 order-md-0">
                            <div className="p-3">
                                <h1 className="display-4 fw-bold">Let's talk</h1>
                                <p className="lead">To request a quote or want to meet up for coffee, contact us directly or fill out the form and we will get back to you promptly</p>
                                <div className="">
                                    <p className="lead"><span className="svg-icon svg-icon-sm d-inline-block me-2"><BsGeoAlt /></span> {appSettings.company.address}</p>
                                    <p className="lead"><span className="svg-icon svg-icon-sm d-inline-block me-2"><BsEnvelope /></span> <a href={`mailto:${appSettings.company.email}`}>{appSettings.company.email}</a></p>
                                    <p className="lead"><span className="svg-icon svg-icon-sm d-inline-block me-2"><BsPhone /></span> {((phoneNumber) => (<Link href={phoneNumber.getURI()}><a>{phoneNumber.formatInternational()}</a></Link>))(parsePhoneNumber(appSettings.company.phoneNumber))}</p>
                                    <div className="hstack gap-2 d-inline-flex mb-3">
                                        {appSettings.company.facebookLink && (
                                            <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Check out our facebook</Tooltip>}>
                                                <a href={appSettings.company.facebookLink} target="_blank" rel="noreferrer" className="btn btn-soft-light btn-icon btn-sm rounded-pill">
                                                    <span className="svg-icon svg-icon-sm"><SvgFacebookLogo /></span>
                                                </a>
                                            </OverlayTrigger>
                                        )}
                                        {appSettings.company.instagramLink && (
                                            <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Join our instagram</Tooltip>}>
                                                <a href={appSettings.company.instagramLink} target="_blank" rel="noreferrer" className="btn btn-soft-light btn-icon btn-sm rounded-pill">
                                                    <span className="svg-icon svg-icon-sm"><SvgInstagramLogo /></span>
                                                </a>
                                            </OverlayTrigger>
                                        )}
                                        {appSettings.company.linkedinLink && (
                                            <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Follow us on Linkedin</Tooltip>}>
                                                <a href={appSettings.company.linkedinLink} target="_blank" rel="noreferrer" className="btn btn-soft-light btn-icon btn-sm rounded-pill">
                                                    <span className="svg-icon svg-icon-sm"><SvgLinkedinLogo /></span>
                                                </a>
                                            </OverlayTrigger>
                                        )}
                                        {appSettings.company.twitterLink && (
                                            <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>See what we tweet about</Tooltip>}>
                                                <a href={appSettings.company.linkedinLink} target="_blank" rel="noreferrer" className="btn btn-soft-light btn-icon btn-sm rounded-pill">
                                                    <span className="svg-icon svg-icon-sm"><SvgTwitterLogo /></span>
                                                </a>
                                            </OverlayTrigger>
                                        )}
                                        {appSettings.company.youtubeLink && (
                                            <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Watch our Youtube</Tooltip>}>
                                                <a href={appSettings.company.youtubeLink} target="_blank" rel="noreferrer" className="btn btn-soft-light btn-icon btn-sm rounded-pill">
                                                    <span className="svg-icon svg-icon-sm"><SvgYoutubeLogo /></span>
                                                </a>
                                            </OverlayTrigger>
                                        )}
                                    </div>
                                    <div><Link href={{ pathname: `${ModalPathPrefix}/contact`, query: { subject: "getInTouch" } }}><a className="btn btn-primary  px-8 mb-3">Get in touch</a></Link></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="bg-light">
                <iframe className="rounded" src={appSettings.company.mapLink} frameBorder={0} style={{ border: "none", width: "100%", height: "400px" }} allowFullScreen={true}></iframe>
            </div>
        </>
    )
};

export default Contact;