type TgsFilePlayerProps = {
  className?: string;
  src: string;
  autoplay?: boolean;
  loop?: boolean;
};

function TgsFilePlayer(props: TgsFilePlayerProps) {
  return (
    <tgs-player
      class={props.className}
      src={props.src}
      autoplay={Boolean(props.autoplay)}
      loop={Boolean(props.loop)}
    />
  );
}

export default TgsFilePlayer;
