import Image from 'next/image';
import CooperationLogoImage from '../_assets/images/cooperation-logo.svg';

export const Header = () => <div className="flex flex-col items-center gap-1 mb-2">
    <Image src={CooperationLogoImage} alt="Onton x TON Society" />

    <span className="text-xs">Presents</span>
</div>