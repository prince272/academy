import { BsThreeDots } from 'react-icons/bs';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { SocialIcon } from 'react-social-icons';

const ShareButtons = ({ social }) => {

    return (
        <>
            <div className="hstack gap-2 d-inline-flex">
                {social.facebookLink && (
                    <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Facebook</Tooltip>}>
                        <SocialIcon url={social.facebookLink} network="facebook" style={{ height: 32, width: 32 }} />
                    </OverlayTrigger>
                )}
                {social.instagramLink && (
                    <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Instagram</Tooltip>}>
                        <SocialIcon url={social.instagramLink} network="instagram" style={{ height: 32, width: 32 }} />
                    </OverlayTrigger>
                )}
                {social.linkedinLink && (
                    <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Linkedin</Tooltip>}>
                        <SocialIcon url={social.linkedinLink} network="linkedin" style={{ height: 32, width: 32 }} />
                    </OverlayTrigger>
                )}
                {social.twitterLink && (
                    <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Twitter</Tooltip>}>
                        <SocialIcon url={social.twitterLink} network="twitter" style={{ height: 32, width: 32 }} />
                    </OverlayTrigger>
                )}
                {social.whatsAppLink && (
                    <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>whatsApp</Tooltip>}>
                        <SocialIcon url={social.whatsAppLink} network="whatsapp" style={{ height: 32, width: 32 }} />
                    </OverlayTrigger>
                )}
            </div>
        </>
    );
};

export default ShareButtons;