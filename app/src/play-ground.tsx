import Toolbar from '@/components/toolbar'
import WalletAdapter from './components/wallet-adapter'

export default function PlayGround() {
  return (
    <WalletAdapter>
      <div className=" h-screen w-screen bg-base-100">
        <button className="btn">HEY</button>
        <h1>Hey nsh</h1>

        <Toolbar />
      </div>
    </WalletAdapter>
  )
}

