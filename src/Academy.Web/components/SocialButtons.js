import { BsThreeDots, BsTelephoneFill, BsEnvelopeFill } from 'react-icons/bs';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { SocialIcon } from 'react-social-icons';

const ShareButtons = ({ social }) => {

    social = {
        email: social.email,
        phoneNumber: social.phoneNumber,
        facebookLink: social.facebookLink,
        instagramLink: social.instagramLink,
        linkedinLink: social.linkedinLink,
        twitterLink: social.twitterLink,
        whatsAppLink: social.whatsAppLink
    };

    return (
        <>
            {!!Object.values(social).filter(v => v).length &&
                <div className="hstack gap-2 d-inline-flex">
                    {social.email && (
                        <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Email</Tooltip>}>
                            <a href={`mailto:${social.email}`} className="btn btn-primary btn-icon btn-sm rounded-pill" onClick={async () => {

                            }}><span><BsEnvelopeFill /></span></a>
                        </OverlayTrigger>
                    )}
                    {social.phoneNumber && (
                        <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Phone number</Tooltip>}>
                            <a href={`tel:${social.phoneNumber}`} className="btn btn-dark btn-icon btn-sm rounded-pill" onClick={async () => {

                            }}><span><BsTelephoneFill /></span></a>
                        </OverlayTrigger>
                    )}
                    {social.facebookLink && (
                        <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Facebook</Tooltip>}>
                            <div><SocialIcon url={social.facebookLink} network="facebook" style={{ height: 32, width: 32 }} target="_blank" /></div>
                        </OverlayTrigger>
                    )}
                    {social.instagramLink && (
                        <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Instagram</Tooltip>}>
                            <div><SocialIcon url={social.instagramLink} network="instagram" style={{ height: 32, width: 32 }} target="_blank" /></div>
                        </OverlayTrigger>
                    )}
                    {social.linkedinLink && (
                        <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Linkedin</Tooltip>}>
                            <div><SocialIcon url={social.linkedinLink} network="linkedin" style={{ height: 32, width: 32 }} target="_blank" /></div>
                        </OverlayTrigger>
                    )}
                    {social.twitterLink && (
                        <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Twitter</Tooltip>}>
                            <div><SocialIcon url={social.twitterLink} network="twitter" style={{ height: 32, width: 32 }} target="_blank" /></div>
                        </OverlayTrigger>
                    )}
                    {social.whatsAppLink && (
                        <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>whatsApp</Tooltip>}>
                            <div><SocialIcon url={social.whatsAppLink} network="whatsapp" style={{ height: 32, width: 32 }} target="_blank" /></div>
                        </OverlayTrigger>
                    )}
                </div>
            }
        </>
    );
};

export default ShareButtons;