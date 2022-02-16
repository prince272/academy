using Academy.Server.Utilities;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Collections.Generic;

namespace Academy.Server.Data.Entities
{
    public interface IExtendable
    {
        string ExtensionData { get; set; }
    }

    public static class ExtendableExtensions
    {
        public static T GetData<T>(this IExtendable extendableObject, string name, bool handleType = false)
        {
            if (extendableObject is null) throw new System.ArgumentNullException(nameof(extendableObject));
            if (name is null) throw new System.ArgumentNullException(nameof(name));

            return extendableObject.GetData<T>(
                name,
                handleType
                    ? new JsonSerializer { TypeNameHandling = TypeNameHandling.All }
                    : JsonSerializer.CreateDefault()
            );
        }

        public static T GetData<T>(this IExtendable extendableObject, string name, JsonSerializer jsonSerializer)
        {
            if (extendableObject is null) throw new System.ArgumentNullException(nameof(extendableObject));
            if (name is null) throw new System.ArgumentNullException(nameof(name));

            if (extendableObject.ExtensionData == null)
            {
                return default(T);
            }

            var json = JObject.Parse(extendableObject.ExtensionData);

            var prop = json[name];
            if (prop == null)
            {
                return default(T);
            }

            if (TypeHelper.IsPrimitiveExtendedIncludingNullable(typeof(T)))
            {
                return prop.Value<T>();
            }
            else
            {
                return (T)prop.ToObject(typeof(T), jsonSerializer ?? JsonSerializer.CreateDefault());
            }
        }

        public static void SetData<T>(this IExtendable extendableObject, string name, T value, bool handleType = false)
        {
            if (extendableObject is null) throw new System.ArgumentNullException(nameof(extendableObject));
            if (name is null) throw new System.ArgumentNullException(nameof(name));

            extendableObject.SetData(
                name,
                value,
                handleType
                    ? new JsonSerializer { TypeNameHandling = TypeNameHandling.All }
                    : JsonSerializer.CreateDefault()
            );
        }

        public static void SetData<T>(this IExtendable extendableObject, string name, T value, JsonSerializer jsonSerializer)
        {
            if (extendableObject is null) throw new System.ArgumentNullException(nameof(extendableObject));
            if (name is null) throw new System.ArgumentNullException(nameof(name));

            if (jsonSerializer == null)
            {
                jsonSerializer = JsonSerializer.CreateDefault();
            }

            if (extendableObject.ExtensionData == null)
            {
                if (EqualityComparer<T>.Default.Equals(value, default(T)))
                {
                    return;
                }

                extendableObject.ExtensionData = "{}";
            }

            var json = JObject.Parse(extendableObject.ExtensionData);

            if (value == null || EqualityComparer<T>.Default.Equals(value, default(T)))
            {
                if (json[name] != null)
                {
                    json.Remove(name);
                }
            }
            else if (TypeHelper.IsPrimitiveExtendedIncludingNullable(value.GetType()))
            {
                json[name] = new JValue(value);
            }
            else
            {
                json[name] = JToken.FromObject(value, jsonSerializer);
            }

            var data = json.ToString(Formatting.None);
            if (data == "{}")
            {
                data = null;
            }

            extendableObject.ExtensionData = data;
        }

        public static bool RemoveData(this IExtendable extendableObject, string name)
        {
            if (extendableObject is null) throw new System.ArgumentNullException(nameof(extendableObject));
            if (name is null) throw new System.ArgumentNullException(nameof(name));

            if (extendableObject.ExtensionData == null)
            {
                return false;
            }

            var json = JObject.Parse(extendableObject.ExtensionData);

            var token = json[name];
            if (token == null)
            {
                return false;
            }

            json.Remove(name);

            var data = json.ToString(Formatting.None);
            if (data == "{}")
            {
                data = null;
            }

            extendableObject.ExtensionData = data;

            return true;
        }

        //TODO: string[] GetExtendedPropertyNames(...)
    }
}