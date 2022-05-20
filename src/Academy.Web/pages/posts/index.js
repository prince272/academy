import _ from 'lodash';
import Link from 'next/link';
import { NextSeo } from 'next-seo';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useContext, useEffect, useState } from 'react';
import { useClient } from '../../utils/client';
import { useAlternativePrevious, withRemount } from '../../utils/hooks';
import Loader from '../../components/Loader';
import { AspectRatio } from 'react-aspect-ratio';
import { BsCardImage, BsThreeDots, BsPlus, BsBookHalf, BsCaretDownFill, BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { Dropdown, OverlayTrigger, Tooltip, ProgressBar } from 'react-bootstrap';
import { ModalPathPrefix, useModal } from '../../modals';
import { CourseItem } from '../../components/courses';
import { ScrollMenu, VisibilityContext } from 'react-horizontal-scrolling-menu';
import { useForm } from 'react-hook-form';
import { sentenceCase } from 'change-case';
import { useAppSettings } from '../../utils/appSettings';
import InfiniteScroll from 'react-infinite-scroll-component';
import { cleanObject, preventDefault } from '../../utils/helpers';
import { SvgWebSearchIllus } from '../../resources/images/illustrations';
import Mounted from '../../components/Mounted';
import { useEventDispatcher } from '../../utils/eventDispatcher';
import { useQueryState } from 'next-usequerystate';

const PostsPage = withRemount((props) => {

    return <></>;
});

export default PostsPage;