type AppLoaderProps = {
  label?: string;
};

export default function AppLoader({ label = "Loading..." }: AppLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="loader" aria-hidden="true">
        <div className="box box0"><div /></div>
        <div className="box box1"><div /></div>
        <div className="box box2"><div /></div>
        <div className="box box3"><div /></div>
        <div className="box box4"><div /></div>
        <div className="box box5"><div /></div>
        <div className="box box6"><div /></div>
        <div className="box box7"><div /></div>
        <div className="ground"><div /></div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{label}</p>
    </div>
  );
}
