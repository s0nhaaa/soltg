import { User2 } from 'lucide-react'

export default function Toolbar() {
  return (
    <div className="absolute bottom-4 left-[50%] flex translate-x-[-50%] gap-1 rounded-xl bg-white p-1 shadow-lg ">
      <button className=" btn btn-square btn-primary">
        <User2 size={20} />
      </button>
      <button className=" btn  btn-square">
        <User2 size={20} />
      </button>
      
    </div>
  )
}
