import { BsThreeDots } from 'react-icons/bs';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { SocialIcon } from 'react-social-icons';

const ShareButtons = ({ social }) => {

    social = {
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
                    {social.facebookLink && (
                        <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Facebook</Tooltip>}>
                            <SocialIcon url={social.facebookLink} network="facebook" style={{ height: 32, width: 32 }} target="_blank" />
                        </OverlayTrigger>
                    )}
                    {social.instagramLink && (
                        <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Instagram</Tooltip>}>
                            <SocialIcon url={social.instagramLink} network="instagram" style={{ height: 32, width: 32 }} target="_blank" />
                        </OverlayTrigger>
                    )}
                    {social.linkedinLink && (
                        <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Linkedin</Tooltip>}>
                            <SocialIcon url={social.linkedinLink} network="linkedin" style={{ height: 32, width: 32 }} target="_blank" />
                        </OverlayTrigger>
                    )}
                    {social.twitterLink && (
                        <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Twitter</Tooltip>}>
                            <SocialIcon url={social.twitterLink} network="twitter" style={{ height: 32, width: 32 }} target="_blank" />
                        </OverlayTrigger>
                    )}
                    {social.whatsAppLink && (
                        <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>whatsApp</Tooltip>}>
                            <SocialIcon url={social.whatsAppLink} network="whatsapp" style={{ height: 32, width: 32 }} target="_blank" />
                        </OverlayTrigger>
                    )}
                </div>
            }
        </>
    );
};

export default ShareButtons;