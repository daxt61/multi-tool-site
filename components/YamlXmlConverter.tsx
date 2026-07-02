import { XmlYamlConverter } from './XmlYamlConverter';

export function YamlXmlConverter(props: any) {
  const initialData = {
    ...props.initialData,
    direction: props.initialData?.direction || 'yaml-to-xml'
  };
  return <XmlYamlConverter {...props} initialData={initialData} />;
}
