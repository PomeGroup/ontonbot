import React, { useEffect, useRef, useState } from "react";
import QRCodeStyling, { Options } from "qr-code-styling";

interface RegistrantCheckInQrCodeProps {
  registrant_uuid: string;
}

/**
 * Free event in-person registrant check in qr code
 * @param registrant_uuid - uuid of the registrant that will be put in the qr code
 */
const RegistrantCheckInQrCode = (props: RegistrantCheckInQrCodeProps) => {
  const [options] = useState<Options>({
    type: "svg",
    data: props.registrant_uuid,
    margin: 10,
    qrOptions: {
      typeNumber: 0,
      mode: "Byte",
      errorCorrectionLevel: "Q",
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 20,
      crossOrigin: "anonymous",
    },
  });

  const [qrCode] = useState(new QRCodeStyling(options));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    qrCode.append(ref.current!);
  }, []);

  return (
    <div
      className="[&>*]:w-full"
      ref={ref}
    />
  );
};

export default RegistrantCheckInQrCode;
