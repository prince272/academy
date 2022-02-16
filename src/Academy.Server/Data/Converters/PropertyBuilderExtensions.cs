﻿using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Academy.Server.Data.Converters
{
    /// <summary>
    /// Extensions for <see cref="PropertyBuilder"/>.
    /// </summary>
    public static class PropertyBuilderExtensions
    {
        /// <summary>
        /// Serializes field as JSON blob in database.
        /// </summary>
        public static PropertyBuilder<T> HasJsonValueConversion<T>(this PropertyBuilder<T> propertyBuilder) where T : class
        {

            propertyBuilder
              .HasConversion(new JsonValueConverter<T>())
              .Metadata.SetValueComparer(new JsonValueComparer<T>());

            return propertyBuilder;

        }
    }
}
