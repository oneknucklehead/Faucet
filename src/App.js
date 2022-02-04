import { useCallback, useEffect, useState } from 'react'
import './App.css'
import Web3 from 'web3'
import detectEthereumProvider from '@metamask/detect-provider'
import { loadContract } from './utils/load-contract'

function App() {
  const [web3Api, setWeb3Api] = useState({
    provider: null,
    isProviderLoaded: false,
    web3: null,
    contract: null,
  })
  const [account, setAccount] = useState(null)
  const [balance, setBalance] = useState(null)
  const [shouldReload, setShouldReload] = useState(false)
  const canConnectToContract = account && web3Api.contract
  const setAccountListener = (provider) => {
    provider.on('accountsChanged', () => {
      window.location.reload()
    })
    provider.on('chainChanged', () => {
      window.location.reload()
    })
  }

  const reloadEffect = useCallback(() => {
    setShouldReload(!shouldReload)
  }, [shouldReload])

  useEffect(() => {
    const loadProvider = async () => {
      const provider = await detectEthereumProvider()
      if (provider) {
        const contract = await loadContract('Faucet', provider)
        setAccountListener(provider)
        setWeb3Api({
          web3: new Web3(provider),
          provider,
          contract,
          isProviderLoaded: true,
        })
      } else {
        setWeb3Api((api) => ({ ...api, isProviderLoaded: true }))
        console.error('Please, install Metamask')
      }
    }

    loadProvider()
  }, [])

  const addFunds = useCallback(async () => {
    const { contract, web3 } = web3Api
    await contract.addFunds({
      from: account,
      value: web3.utils.toWei('1', 'ether'),
    })
    reloadEffect()
  }, [web3Api, account, reloadEffect])

  const withdraw = useCallback(async () => {
    const { contract, web3 } = web3Api
    const withdrawAmount = web3.utils.toWei('0.1', 'ether')
    await contract.withdraw(withdrawAmount, {
      from: account,
    })
    reloadEffect()
  }, [web3Api, account, reloadEffect])
  useEffect(() => {
    const loadBalance = async () => {
      const { contract, web3 } = web3Api
      const balance = await web3.eth.getBalance(contract.address)
      setBalance(web3.utils.fromWei(balance, 'ether'))
    }
    web3Api.contract && loadBalance()
  }, [web3Api, shouldReload])

  useEffect(() => {
    const getAccounts = async () => {
      const accounts = await web3Api.web3.eth.getAccounts()
      setAccount(accounts[0])
    }
    web3Api.web3 && getAccounts()
  }, [web3Api.web3])

  return (
    <>
      <div className='faucet-wrapper'>
        <div className='faucet'>
          {web3Api.isProviderLoaded ? (
            <div className='is-flex is-align-items-center'>
              <span>
                <strong className='mr-2'>Account: </strong>
              </span>
              {account ? (
                <div>{account}</div>
              ) : !web3Api.provider ? (
                <div className='notification is-warning is-size-7'>
                  Wallet not detected, Install
                  <a
                    target='_blank'
                    href='https://metamask.io/download/'
                    rel='noreferrer'
                  >
                    {' '}
                    Metamask
                  </a>
                </div>
              ) : (
                <button
                  className='button'
                  onClick={() => {
                    web3Api.provider.request({ method: 'eth_requestAccounts' })
                  }}
                >
                  Connect Wallet
                </button>
              )}
            </div>
          ) : (
            <span>Looking for Web3...</span>
          )}
          <div className='balance-view is-size-2'>
            Current Balance: <strong>{balance}</strong> ETH
          </div>
          {!canConnectToContract && (
            <i className='is-block'>Connect to Ganache network</i>
          )}
          <button
            className='button is-primary is-light mr-2'
            onClick={addFunds}
            disabled={!canConnectToContract}
          >
            Donate 1 eth
          </button>
          <button
            disabled={!canConnectToContract}
            className='button is-link is-light'
            onClick={withdraw}
          >
            Withdraw 0.1 eth
          </button>
        </div>
      </div>
    </>
  )
}

export default App
