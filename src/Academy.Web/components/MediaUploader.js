import _ from 'lodash';
import { FilePond, registerPlugin } from './filepond';
import 'filepond/dist/filepond.min.css';

import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import 'filepond-plugin-media-preview/dist/filepond-plugin-media-preview.css';

import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

import FilePondPluginMediaPreview from 'filepond-plugin-media-preview';

import { useEffect, useRef, useState } from 'react';

import toast from 'react-hot-toast';

import { useClient } from '../utils/client';

// Register the plugins
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview, FilePondPluginMediaPreview);


const MediaExtensions = {
    IMAGE: '.jpg, .jpeg, .png',
    VIDEO: '.mp4, .webm, .swf, .flv',
    AUDIO: '.mp3, .ogg, .wav',
    DOCUMENT: '.doc, .docx, .rtf, .pdf',
}

const MediaUploader = ({ value, onChange, extensions, length, layout }) => {

    const filePondRef = useRef();
    const [filePondId] = useState(() => _.uniqueId('file-pond_'));
    const client = useClient();

    useEffect(() => {

        // Ensure parse value to array of ids.
        const newIds = Array.isArray(value) ? (value.map(v => `${v}`)) : (value != null ? [`${value}`] : []);
        const oldIds = filePondRef.current.getFiles().map(file => file.serverId);

        const removeIds = _.difference(oldIds, newIds);
        removeIds.forEach(id => {
            filePondRef.current.removeFile(id);
        });

        const addIds = _.difference(newIds, oldIds);
        addIds.forEach(id => {
            filePondRef.current.addFile(id, { type: 'local' });
        });


    }, [value]);

    const accessToken = client.accessToken;

    return (
        <div className={`border mx-auto ${layout == 'circle' ? "rounded-pill" : ""}`} style={{ ...(layout == 'circle' ? { width: "170px", height: "170px" } : {}) }}>
            <FilePond
                ref={filePondRef}
                allowImagePreview={true}
                allowImageExifOrientation={true}
                allowMultiple={true}

                labelIdle={`Drag & drop your ${length == 1 ? 'file' : 'files'} or <span class="filepond--label-action"> Browse </span><span style="display:block">${extensions}</span>`}
             
                {...(layout == 'circle' ? {
                    imageCropAspectRatio: '1:1',
                    stylePanelLayout: 'compact circle',
                    styleLoadIndicatorPosition: 'center bottom',
                    styleProgressIndicatorPosition: 'right bottom',
                    styleButtonRemoveItemPosition: 'left bottom',
                    styleButtonProcessItemPosition: 'right bottom',
                } : {})}

                maxFiles={length}
                chunkUploads={true}
                chunkForce={true}
                server={{
                    url: process.env.NEXT_PUBLIC_SERVER_URL,
                    process: {
                        url: '/medias/upload',
                        withCredentials: true,
                        headers: (file) => {
                            const headers = {
                                'Upload-Name': file.name,
                                'Upload-Size': file.size,
                                'Accept-Extensions': extensions,
                                ...(!accessToken ? {} : { 'Authorization': `Bearer ${accessToken}` })
                            }
                            return headers;
                        },
                        onload: (response) => {
                            const data = JSON.parse(response.responseText).data;
                            return data.id;
                        },
                        onerror: (responseText) => {
                            try {
                                const error = JSON.parse(responseText).error;
                                toast.error(error.message, { id: filePondId });
                            } catch { }
                        }
                    },
                    patch: {
                        url: '/medias/upload/',
                        withCredentials: true,
                        headers: {
                            ...(!accessToken ? {} : { 'Authorization': `Bearer ${accessToken}` })
                        },
                        onerror: (responseText) => {
                            try {
                                const error = JSON.parse(responseText).error;
                                toast.error(error.message, { id: filePondId });
                            } catch { }
                        }
                    },
                    load: {
                        url: '/medias/load/',
                        headers: {
                            ...(!accessToken ? {} : { 'Authorization': `Bearer ${accessToken}` })
                        },
                        onerror: (responseText) => {
                            try {
                                const error = JSON.parse(responseText).error;
                                toast.error(error.message, { id: filePondId });
                            } catch { }
                        }
                    },
                    revert: null,
                }}
                onprocessfile={(error, file) => {
                    if (!error) {
                        const newValue = (Array.isArray(value)) ? filePondRef.current.getFiles().map(file => `${file.serverId}`) : (`${file.serverId}` || null);
                        onChange && onChange(newValue);
                    }
                }}
                onremovefile={(error, file) => {
                    if (!error) {
                        const newValue = (Array.isArray(value)) ? value.filter(id => id != file.serverId) : null;
                        onChange && onChange(newValue);
                    }
                }} />
            <style jsx>{`
            div > :global(.filepond--wrapper .filepond--root) {
                margin-bottom: 0;
            }
            
            /* use a hand cursor intead of arrow for the action buttons */
            div > :global(.filepond--wrapper .filepond--file-action-button) {
                cursor: pointer;
            }
            
            /* the text color of the drop label*/
            div > :global(.filepond--wrapper .filepond--drop-label) {
                background-color: transparent !important;
                font-size: .875em !important;
                padding: 10px;
                opacity: 1;
                z-index: 0;
            }
            
            /* underline color for "Browse" button */
            div > :global(.filepond--wrapper .filepond--label-action) {
                text-decoration-color: #aaa;
            }

            /* the background color of the filepond drop area */
            div > :global(.filepond--wrapper .filepond--panel-root) {
                background-color: transparent !important;
                border: none;
            }
            
            /* the border radius of the file item */
            div > :global(.filepond--wrapper .filepond--item-panel) {
                border-radius: .3125rem;
            }

            /* the background color of the file and file panel (used when dropping an image) */
            div > :global(.filepond--wrapper .filepond--item-panel) {
                background-color: #555;
            }

            /* the background color of the drop circle */
            div > :global(.filepond--wrapper .filepond--drip-blob) {
                background-color: #999;
            }
            
            /* the background color of the black action buttons */
            div > :global(.filepond--wrapper .filepond--file-action-button) {
                background-color: rgba(0, 0, 0, 0.5);
            }

            /* the icon color of the black action buttons */
            div > :global(.filepond--wrapper .filepond--file-action-button) {
                color: white;
            }

            /* the color of the focus ring */
            div > :global(.filepond--wrapper .filepond--file-action-button:hover),
            div > :global(.filepond--wrapper .filepond--file-action-button:focus) {
                box-shadow: 0 0 0 0.125em rgba(255, 255, 255, 0.9);
            }
            
            /* the text color of the file status and info labels */
            div > :global(.filepond--wrapper .filepond--file) {
                color: white;
            }
            
            /* error state color */
            div > :global(.filepond--wrapper [data-filepond-item-state*='error'] .filepond--item-panel),
            div > :global(.filepond--wrapper [data-filepond-item-state*='invalid'] .filepond--item-panel) {
                background-color: var(--bs-danger) !important;
            }

            div > :global(.filepond--wrapper [data-filepond-item-state='processing-complete'] .filepond--item-panel) {
                background-color: var(--bs-primary) !important;
            }
            
            div > :global(.filepond--wrapper .filepond--credits) { 
                display: none;
            }`}</style>
        </div>
    )
};

export { MediaExtensions }
export default MediaUploader;