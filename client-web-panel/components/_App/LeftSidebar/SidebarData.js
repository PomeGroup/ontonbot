import React from "react";
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import GridViewIcon from "@mui/icons-material/GridView";
import LayersIcon from "@mui/icons-material/Layers";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LockIcon from "@mui/icons-material/Lock";
import SettingsIcon from "@mui/icons-material/Settings";
import PostAddIcon from "@mui/icons-material/PostAdd";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import AddchartIcon from "@mui/icons-material/Addchart";
import WifiOffIcon from '@mui/icons-material/WifiOff';
import PeopleIcon from "@mui/icons-material/People";
import CopyAllIcon from "@mui/icons-material/CopyAll";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import ViewQuiltIcon from "@mui/icons-material/ViewQuilt";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import PersonPinIcon from "@mui/icons-material/PersonPin";
import {NoCrash} from "@mui/icons-material";
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StyleIcon from '@mui/icons-material/Style';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import SubscriptionsIcon from '@mui/icons-material/Subscriptions';
import ReceiptIcon from '@mui/icons-material/Receipt';

export const SidebarData = [
  {
    title: "home",
    path: "/dashboard/",
    icon: <GridViewIcon/>,
    iconClosed: <AddIcon/>,
    iconOpened: <KeyboardArrowDownIcon/>,

  },


  {
    title: "logout",
    path: "/logout/",
    icon: <SettingsIcon/>,
    iconClosed: <AddIcon/>,
    iconOpened: <KeyboardArrowDownIcon/>,
  },

];

