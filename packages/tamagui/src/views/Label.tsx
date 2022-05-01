import { useId } from '@react-aria/utils'
import { GetProps, ReactComponentWithRef, isWeb, styled, themeable } from '@tamagui/core'
import * as React from 'react'
import { View } from 'react-native'

import { useComposedRefs } from '../helpers/composeRefs'
import { createContext } from '../helpers/createContext'
import { getButtonSize } from '../helpers/getButtonSize'
import { sizableTextSizeVariant } from '../helpers/sizableTextSizeVariant'
import { SizableText } from './SizableText'

const NAME = 'Label'

type LabelContextValue = {
  id?: string
  controlRef: React.MutableRefObject<HTMLElement | null>
}

const [LabelProvider, useLabelContextImpl] = createContext<LabelContextValue>(NAME, {
  id: undefined,
  controlRef: { current: null },
})

const buttonSizer = getButtonSize()
const textSizer = sizableTextSizeVariant

export const LabelFrame = styled(SizableText, {
  name: 'Label',
  tag: 'label',
  size: '$4',
  backgroundColor: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'default',
  pressStyle: {
    color: '$colorPress',
  },
  variants: {
    size: {
      '...size': (val, extras) => {
        return {
          ...buttonSizer(val, extras),
          ...textSizer(val, extras),
        }
      },
    },
  },
})

export type LabelProps = GetProps<typeof LabelFrame> & {
  htmlFor: string
}

const LabelComponent = React.forwardRef<typeof LabelFrame, LabelProps>((props, forwardedRef) => {
  const { htmlFor, id: idProp, ...labelProps } = props
  const controlRef = React.useRef<HTMLElement | null>(null)
  const ref = React.useRef<any>(null)
  const composedRefs = useComposedRefs(forwardedRef, ref)
  const id = useId(idProp)

  if (isWeb) {
    React.useEffect(() => {
      if (htmlFor) {
        const element = document.getElementById(htmlFor)
        const label = ref.current
        if (label && element) {
          const getAriaLabel = () => element.getAttribute('aria-labelledby')
          const ariaLabelledBy = [id, getAriaLabel()].filter(Boolean).join(' ')
          element.setAttribute('aria-labelledby', ariaLabelledBy)
          controlRef.current = element
          return () => {
            /**
             * We get the latest attribute value because at the time that this cleanup fires,
             * the values from the closure may have changed.
             */
            const ariaLabelledBy = getAriaLabel()?.replace(id, '')
            if (ariaLabelledBy === '') {
              element.removeAttribute('aria-labelledby')
            } else if (ariaLabelledBy) {
              element.setAttribute('aria-labelledby', ariaLabelledBy)
            }
          }
        }
      }
    }, [id, htmlFor])
  }

  return (
    <LabelProvider id={id} controlRef={controlRef}>
      <LabelFrame
        // @ts-ignore
        role="label"
        id={id}
        {...labelProps}
        ref={composedRefs}
        onMouseDown={(event) => {
          props.onMouseDown?.(event)
          // prevent text selection when double clicking label
          if (!event.defaultPrevented && event.detail > 1) {
            event.preventDefault()
          }
        }}
        onPress={(event) => {
          props.onPress?.(event)
          if (!controlRef.current || event.defaultPrevented) return
          const isClickingControl = controlRef.current.contains(event.target as any as Node)
          // Ensure event was generated by a user action
          // https://developer.mozilla.org/en-US/docs/Web/API/Event/isTrusted
          const isUserClick = event.isTrusted === true
          /**
           * When a label is wrapped around the control it labels, we trigger the appropriate events
           * on the control when the label is clicked. We do nothing if the user is already clicking the
           * control inside the label.
           */
          if (!isClickingControl && isUserClick) {
            controlRef.current.click()
            controlRef.current.focus()
          }
        }}
      />
    </LabelProvider>
  )
})

LabelComponent.displayName = NAME

export const Label: ReactComponentWithRef<LabelProps, HTMLButtonElement | View> =
  LabelFrame.extractable(themeable(LabelComponent as any) as any, {
    neverFlatten: true,
  })

export const useLabelContext = (element?: HTMLElement | null) => {
  const context = useLabelContextImpl('LabelConsumer')
  const { controlRef } = context

  React.useEffect(() => {
    if (element) controlRef.current = element
  }, [element, controlRef])

  return context.id
}

const Root = Label
