import { InteractiveProductCard } from "@/components/ui/card-7";

export default function InteractiveProductCardDemo() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-background p-4">
      <InteractiveProductCard
        title="Nike M2K Tekno"
        description="Elevate Your Every Step"
        price="$149"
        imageUrl="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        logoUrl="https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg"
      />
    </div>
  );
}
