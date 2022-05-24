import { BsThreeDots } from 'react-icons/bs';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import {
    EmailShareButton, EmailIcon,
    FacebookShareButton, FacebookIcon,
    WhatsappShareButton, WhatsappIcon,
    LinkedinShareButton, LinkedinIcon,
    TwitterShareButton, TwitterIcon

} from "react-share";
import { RWebShare } from "react-web-share";

const ShareButtons = ({ share }) => {

    return (
        <>
            <div className="hstack gap-2">
                <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Send to Email</Tooltip>}>
                    <EmailShareButton url={share.url}><EmailIcon size={32} round /></EmailShareButton>
                </OverlayTrigger>

                <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Share on Whatsapp</Tooltip>}>
                    <WhatsappShareButton url={share.url}><WhatsappIcon size={32} round /></WhatsappShareButton>
                </OverlayTrigger>

                <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Share on Linkedin</Tooltip>}>
                    <LinkedinShareButton url={share.url}><LinkedinIcon size={32} round /></LinkedinShareButton>
                </OverlayTrigger>

                <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Share on Facebook</Tooltip>}>
                    <FacebookShareButton url={share.url}><FacebookIcon size={32} round /></FacebookShareButton>
                </OverlayTrigger>

                <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>Share on Twitter</Tooltip>}>
                    <TwitterShareButton url={share.url}><TwitterIcon size={32} round /></TwitterShareButton>
                </OverlayTrigger>

                <OverlayTrigger overlay={tooltipProps => <Tooltip {...tooltipProps} arrowProps={{ style: { display: "none" } }}>More options</Tooltip>}>
                    <button type="button" className="btn btn-outline-secondary btn-icon btn-sm rounded-pill" onClick={async () => {
                        try {
                            await navigator.share(share);
                        } catch (err) {
                        }
                    }}><span className="svg-icon svg-icon-xs d-inline-block" ><BsThreeDots /></span></button>
                </OverlayTrigger>
            </div>
        </>
    );
};

export default ShareButtons;