import React, { useEffect } from 'react';
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { SlugEditor } from '@contentful/field-editor-slug';

interface FieldProps {
  sdk: FieldExtensionSDK;
}

const Field = ({sdk}: FieldProps) => {
  // If you only want to extend Contentful's default editing experience
  // reuse Contentful's editor components
  // -> https://www.contentful.com/developers/docs/extensibility/field-editors/
  const commonInfoField = sdk.entry.fields['commonInfo'];
  const field = sdk.field;
  const entrySys = sdk.entry.getSys();
  
  useEffect(() => {
    const removeSubscription = commonInfoField.onValueChanged(async value => {
      if (!value) {
        if (!entrySys.publishedAt) {
          field.setValue('');
        }
        return;
      }

      if (field.getValue()) {
        return;
      }

      const commonInfo: any = await sdk.space.getEntry(value.sys.id);
      
      const codeStart = `${commonInfo.fields.genus.fr.slice(0, 2)}${commonInfo.fields.species.fr.slice(0, 2)}-`.toUpperCase();

      const searchQuery = {
        content_type: entrySys.contentType.sys.id,
        'fields.code[match]': codeStart,
        'sys.id[ne]': entrySys.id,
        order: '-fields.code',
        limit: 1
      }

      const results = await sdk.space.getEntries(searchQuery);

      if (results.total === 0) {
        field.setValue(`${codeStart}01`);
        return;
      }

      const lastPlant: any = results.items[0];
      const lastNumber = parseInt(lastPlant.fields.code.fr.split('-')[1]);
      const nextNumber = lastNumber + 1;
      const nextNumberPadded = nextNumber < 10 ? `0${nextNumber}` : nextNumber;

      field.setValue(`${codeStart}${nextNumberPadded}`);
    })

    return removeSubscription;
  });

  return <SlugEditor baseSdk={sdk} field={field} isInitiallyDisabled={true} />
};

export default Field;
