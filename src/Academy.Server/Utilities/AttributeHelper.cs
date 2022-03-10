using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

namespace Academy.Server.Utilities
{
    public static class AttributeHelper
    {
        private static Dictionary<object, List<Attribute>> _attributeCache = new Dictionary<object, List<Attribute>>();

        public static Dictionary<object, List<Attribute>> AttributeCache { get { return _attributeCache; } }

        // Types
        public static List<Attribute> GetTypeAttributes<TType>()
        {
            return GetTypeAttributes(typeof(TType));
        }

        public static List<Attribute> GetTypeAttributes(Type type)
        {
            return LockAndGetAttributes(type, tp => ((Type)tp).GetCustomAttributes(true));
        }

        public static List<TAttributeType> GetTypeAttributes<TAttributeType>(Type type, Func<TAttributeType, bool> predicate = null)
        {
            return
                GetTypeAttributes(type)
                    .Where<Attribute, TAttributeType>()
                    .Where(attr => predicate == null || predicate(attr))
                    .ToList();
        }

        public static List<TAttributeType> GetTypeAttributes<TType, TAttributeType>(Func<TAttributeType, bool> predicate = null)
        {
            return GetTypeAttributes(typeof(TType), predicate);
        }

        public static TAttributeType GetTypeAttribute<TType, TAttributeType>(Func<TAttributeType, bool> predicate = null)
        {
            return
                GetTypeAttribute(typeof(TType), predicate);
        }

        public static TAttributeType GetTypeAttribute<TAttributeType>(Type type, Func<TAttributeType, bool> predicate = null)
        {
            return
                GetTypeAttributes(type, predicate)
                    .FirstOrDefault();
        }

        public static bool HasTypeAttribute<TType, TAttributeType>(Func<TAttributeType, bool> predicate = null)
        {
            return HasTypeAttribute(typeof(TType), predicate);
        }

        public static bool HasTypeAttribute<TAttributeType>(Type type, Func<TAttributeType, bool> predicate = null)
        {
            return GetTypeAttribute(type, predicate) != null;
        }

        // Members and properties
        public static List<Attribute> GetMemberAttributes<TType>(Expression<Func<TType, object>> action)
        {
            return GetMember(action).GetMemberAttributes();
        }

        public static List<TAttributeType> GetMemberAttributes<TType, TAttributeType>(
            Expression<Func<TType, object>> action,
            Func<TAttributeType, bool> predicate = null)
            where TAttributeType : Attribute
        {
            return GetMember(action).GetMemberAttributes(predicate);
        }

        public static TAttributeType GetMemberAttribute<TType, TAttributeType>(
            Expression<Func<TType, object>> action,
            Func<TAttributeType, bool> predicate = null)
            where TAttributeType : Attribute
        {
            return GetMember(action).GetMemberAttribute(predicate);
        }

        public static TAttributeType GetEnumAttribute<TEnum, TAttributeType>(TEnum value)
            where TAttributeType : Attribute
            where TEnum : struct, Enum
        {
            return GetMemberAttribute<TAttributeType>(typeof(TEnum).GetMember(value.ToString())[0]);
        }

        public static bool HasMemberAttribute<TType, TAttributeType>(Expression<Func<TType, object>> action, Func<TAttributeType, bool> predicate = null) where TAttributeType : Attribute
        {
            return GetMember(action).GetMemberAttribute(predicate) != null;
        }

        // MemberInfo (and PropertyInfo since PropertyInfo inherits from MemberInfo)
        public static List<Attribute> GetMemberAttributes(this MemberInfo memberInfo)
        {
            return
                LockAndGetAttributes(memberInfo, mi => ((MemberInfo)mi).GetCustomAttributes(true));
        }

        public static List<TAttributeType> GetMemberAttributes<TAttributeType>(this MemberInfo memberInfo, Func<TAttributeType, bool> predicate = null) where TAttributeType : Attribute
        {
            return
                memberInfo.GetMemberAttributes()
                    .Where<Attribute, TAttributeType>()
                    .Where(attr => predicate == null || predicate(attr))
                    .ToList();
        }

        public static TAttributeType GetMemberAttribute<TAttributeType>(this MemberInfo memberInfo, Func<TAttributeType, bool> predicate = null) where TAttributeType : Attribute
        {
            return
                memberInfo.GetMemberAttributes(predicate)
                    .FirstOrDefault();
        }

        public static bool HasMemberAttribute<TAttributeType>(this MemberInfo memberInfo, Func<TAttributeType, bool> predicate = null) where TAttributeType : Attribute
        {
            return
                memberInfo.GetMemberAttribute(predicate) != null;
        }

        // Internal stuff
        private static IEnumerable<TType> Where<X, TType>(this IEnumerable<X> list)
        {
            return
                list
                    .Where(item => item is TType)
                    .Cast<TType>();
        }

        private static TType FirstOrDefault<X, TType>(this IEnumerable<X> list)
        {
            return
                list
                    .Where<X, TType>()
                    .FirstOrDefault();
        }

        private static List<Attribute> LockAndGetAttributes(object key, Func<object, object[]> retrieveValue)
        {
            return
                LockAndGet(_attributeCache, key, mi => retrieveValue(mi).Cast<Attribute>().ToList());
        }

        // Method for thread safely executing slow method and storing the result in a dictionary
        private static TValue LockAndGet<TKey, TValue>(Dictionary<TKey, TValue> dictionary, TKey key, Func<TKey, TValue> retrieveValue)
        {
            TValue value = default;
            lock (dictionary)
            {
                if (dictionary.TryGetValue(key, out value))
                {
                    return value;
                }
            }

            value = retrieveValue(key);

            lock (dictionary)
            {
                if (dictionary.ContainsKey(key) == false)
                {
                    dictionary.Add(key, value);
                }

                return value;
            }
        }

        private static MemberInfo GetMember<T>(Expression<Func<T, object>> expression)
        {
            MemberExpression memberExpression = expression.Body as MemberExpression;

            if (memberExpression != null)
            {
                return memberExpression.Member;
            }

            UnaryExpression unaryExpression = expression.Body as UnaryExpression;

            if (unaryExpression != null)
            {
                memberExpression = unaryExpression.Operand as MemberExpression;

                if (memberExpression != null)
                {
                    return memberExpression.Member;
                }

                MethodCallExpression methodCall = unaryExpression.Operand as MethodCallExpression;
                if (methodCall != null)
                {
                    return methodCall.Method;
                }
            }

            return null;
        }
    }
}