'use client'

import { useEffect, useRef } from 'react'
import React from 'react'

import { ParcelShopID, ParcelShopSelected } from '../../types'

interface Props {
  weight?: number
  nbResults?: number
  brandIdAPI: string
  defaultCountry?: string
  defaultPostcode?: string
  allowedCountries?: string
  deliveryMode?: 'LCC' | 'HOM' | '24R' | '24L' | 'XOH'
  onParcelShopSelected(data: ParcelShopSelected & ParcelShopID): void
}

declare global {
  interface Window {
    $: any
    jQuery: any
  }
}

export default function ParcelShopSelector(props: Props) {
  const {
    weight,
    nbResults,
    brandIdAPI,
    deliveryMode,
    defaultCountry = 'FR',
    defaultPostcode = '59000',
    allowedCountries = 'FR',
    onParcelShopSelected,
  } = props

  const targetRef = useRef<HTMLInputElement>(null)
  const widgetInitialized = useRef(false)

  useEffect(() => {
    if (widgetInitialized.current) return
    widgetInitialized.current = true

    injectCSS()
    loadScripts().then(initWidget)

    return () => {
      // cleanup widget DOM on unmount
      const zone = document.getElementById('Zone_Widget')
      if (zone) zone.innerHTML = ''
    }
  }, [])

  function injectCSS() {
    if (document.getElementById('mr-widget-style')) return

    const style = document.createElement('style')
    style.id = 'mr-widget-style'
    style.innerHTML = `
      .Zone_Widget > div { width: 100%; }
      .Target_Widget { visibility: hidden; }

      @media (max-width: 425px) {
        .MR-Widget .MRW-Results {
          height: unset !important;
        }
      }
    `
    document.head.appendChild(style)
  }

  function loadScripts(): Promise<void> {
    return new Promise(resolve => {
      if (window.$) {
        resolve()
        return
      }

      const jquery = document.createElement('script')
      jquery.src = 'https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js'
      jquery.onload = () => {
        const mr = document.createElement('script')
        mr.src = 'https://widget.mondialrelay.com/parcelshop-picker/jquery.plugin.mondialrelay.parcelshoppicker.min.js'
        mr.onload = () => resolve()
        document.body.appendChild(mr)
      }
      document.body.appendChild(jquery)
    })
  }

  function initWidget() {
    if (!window.$) return

    window.$('#Zone_Widget').MR_ParcelShopPicker({
      Target: '#Target_Widget',
      Brand: brandIdAPI === 'BDTEST' ? 'BDTEST  ' : brandIdAPI,
      Country: defaultCountry,
      PostCode: defaultPostcode,
      ColLivMod: deliveryMode || '24R',
      NbResults: String(nbResults ?? 7),

      ShowResultsOnMap: true,
      DisplayMapInfo: true,

      AllowedCountries: allowedCountries,
      CSS: '1',

      ...(weight && { Weight: weight }),

      OnParcelShopSelected: (data: ParcelShopSelected) => {
        onParcelShopSelected({
          ...data,
          // targetRef.current?.value can be undefined at compile time; ensure a string is provided
          ParcelShopID: targetRef.current?.value ?? '',
        })
      },
    })
  }

  return (
    <>
      <div id="Zone_Widget" className="Zone_Widget" />
      <input ref={targetRef} id="Target_Widget" className="Target_Widget" />
    </>
  )
}
